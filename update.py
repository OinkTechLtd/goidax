import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# === Конфигурация ===
GAMES_FILE = 'games.json'
# Список источников для парсинга (каждый источник - функция, возвращающая список игр)
SOURCES = [
    'parse_crazygames',
    'parse_poki',
    'parse_html5games'
]
# Количество потоков для проверки доступности
MAX_WORKERS = 10
# Таймаут для запросов
TIMEOUT = 5

# === Вспомогательные функции ===

def is_url_accessible(url):
    """Проверяет, доступна ли игра по URL (HEAD-запрос, код 200)"""
    try:
        resp = requests.head(url, timeout=TIMEOUT, allow_redirects=True)
        return resp.status_code == 200
    except Exception:
        return False

def normalize_game(game):
    """Приводит игру к единому формату"""
    return {
        'title': game.get('title', '').strip(),
        'category': game.get('category', 'other').lower(),
        'url': game.get('url', '').strip(),
        'image': game.get('image', '').strip()
    }

def load_existing_games():
    """Загружает текущий список игр из JSON"""
    try:
        with open(GAMES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_games(games):
    """Сохраняет список игр в JSON"""
    with open(GAMES_FILE, 'w', encoding='utf-8') as f:
        json.dump(games, f, ensure_ascii=False, indent=2)

# === Парсеры источников ===

def parse_crazygames():
    """Парсит игры с crazygames.com (топ-игры)"""
    games = []
    url = 'https://www.crazygames.com/'
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Ищем карточки игр (обычно они в <a class="game-link"> или похожих)
        for item in soup.select('a.game-link, a[data-test="game-card"]'):
            title = item.get('title') or item.get_text(strip=True)
            link = item.get('href')
            if link and not link.startswith('http'):
                link = urljoin(url, link)
            if title and link:
                img = item.find('img')
                img_src = img.get('src') if img else ''
                games.append({
                    'title': title,
                    'category': 'html5',  # на crazygames в основном HTML5
                    'url': link,
                    'image': img_src if img_src.startswith('http') else urljoin(url, img_src)
                })
        logging.info(f'CrazyGames: найдено {len(games)} игр')
    except Exception as e:
        logging.error(f'Ошибка при парсинге CrazyGames: {e}')
    return games

def parse_poki():
    """Парсит игры с poki.com (популярные)"""
    games = []
    url = 'https://poki.com/'
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Карточки часто имеют класс 'game-card' или 'item'
        for item in soup.select('.game-card, .item, a[href*="/game/"]'):
            link = item.get('href')
            if link and '/game/' in link:
                if not link.startswith('http'):
                    link = urljoin(url, link)
                title = item.get_text(strip=True) or item.get('title')
                img = item.find('img')
                img_src = img.get('src') if img else ''
                if title and link:
                    games.append({
                        'title': title,
                        'category': 'html5',
                        'url': link,
                        'image': img_src if img_src.startswith('http') else urljoin(url, img_src)
                    })
        logging.info(f'Poki: найдено {len(games)} игр')
    except Exception as e:
        logging.error(f'Ошибка при парсинге Poki: {e}')
    return games

def parse_html5games():
    """Парсит игры с html5games.com (топ)"""
    games = []
    url = 'https://www.html5games.com/'
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Ищем элементы с играми
        for item in soup.select('.game-item, .game-box, a[href*="/game/"]'):
            link = item.get('href')
            if link and '/game/' in link:
                if not link.startswith('http'):
                    link = urljoin(url, link)
                title = item.get_text(strip=True) or item.get('title')
                img = item.find('img')
                img_src = img.get('src') if img else ''
                if title and link:
                    games.append({
                        'title': title,
                        'category': 'html5',
                        'url': link,
                        'image': img_src if img_src.startswith('http') else urljoin(url, img_src)
                    })
        logging.info(f'HTML5Games: найдено {len(games)} игр')
    except Exception as e:
        logging.error(f'Ошибка при парсинге HTML5Games: {e}')
    return games

# Можно добавлять свои парсеры по аналогии

# === Основная логика обновления ===

def main():
    logging.info('🚀 Запуск робота обновления игр...')
    
    # 1. Загружаем существующие игры
    existing = load_existing_games()
    logging.info(f'📂 Загружено {len(existing)} существующих игр')
    
    # 2. Проверяем доступность каждой существующей игры
    logging.info('🔍 Проверка доступности существующих игр...')
    alive_games = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_game = {executor.submit(is_url_accessible, game['url']): game for game in existing}
        for future in as_completed(future_to_game):
            game = future_to_game[future]
            try:
                if future.result():
                    alive_games.append(game)
                else:
                    logging.info(f'🗑️ Игра недоступна, удаляем: {game["title"]} ({game["url"]})')
            except Exception as e:
                logging.error(f'Ошибка при проверке {game["title"]}: {e}')
                # В случае ошибки лучше оставить игру
                alive_games.append(game)
    
    logging.info(f'✅ Осталось {len(alive_games)} доступных игр')
    
    # 3. Собираем новые игры из всех источников
    new_games = []
    for source_func_name in SOURCES:
        source_func = globals().get(source_func_name)
        if source_func:
            logging.info(f'🌐 Парсинг источника: {source_func_name}...')
            try:
                parsed = source_func()
                new_games.extend(parsed)
                time.sleep(1)  # вежливость
            except Exception as e:
                logging.error(f'Ошибка в источнике {source_func_name}: {e}')
    
    logging.info(f'🌱 Найдено {len(new_games)} новых игр (до фильтрации)')
    
    # 4. Объединяем с существующими, удаляем дубликаты по URL
    all_games = alive_games.copy()
    seen_urls = {game['url'] for game in all_games}
    added_count = 0
    for game in new_games:
        norm = normalize_game(game)
        if norm['url'] and norm['url'] not in seen_urls:
            all_games.append(norm)
            seen_urls.add(norm['url'])
            added_count += 1
            logging.info(f'➕ Добавлена новая игра: {norm["title"]}')
    
    logging.info(f'📈 Итоговое количество игр: {len(all_games)} (добавлено {added_count})')
    
    # 5. Сохраняем обновлённый список
    save_games(all_games)
    logging.info('💾 Файл games.json обновлён')
    logging.info('✅ Робот завершил работу')

if __name__ == '__main__':
    main()
