# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

"""
Dynamic translations loader from GitHub Pages with intelligent caching.
"""

import json
import logging
import os
import time
from typing import Any

logger = logging.getLogger(__name__)

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    logger.warning("requests not installed. Custom translations disabled.")


_custom_packs: dict[str, dict[str, Any]] = {}
_cache_timestamps: dict[str, float] = {}


try:
    _CACHE_TTL = int(os.getenv('CUSTOM_TRANSLATIONS_CACHE_TTL', '300'))
except ValueError:
    _CACHE_TTL = 300
    logger.warning("Invalid CUSTOM_TRANSLATIONS_CACHE_TTL, using default: 300s")


def is_custom_cache_expired(locale: str) -> bool:
    """Check if custom translations cache has expired."""
    if locale not in _cache_timestamps:
        return True
    return (time.time() - _cache_timestamps[locale]) >= _CACHE_TTL


def _merge_translations(base: dict[str, Any], custom: dict[str, Any]) -> dict[str, Any]:
    """Recursively merge custom translations over base (custom takes precedence)."""
    if not custom:
        return base.copy()
    
    merged = base.copy()
    for key, value in custom.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge_translations(merged[key], value)
        else:
            merged[key] = value
    
    return merged


def get_language_pack_custom(locale: str) -> dict[str, Any]:
    """Fetch custom translations from GitHub Pages."""

    if os.getenv('CUSTOM_TRANSLATIONS_ENABLED', 'false').lower() != 'true':
        return {}
    
    if not HAS_REQUESTS:
        return {}
    
    if not is_custom_cache_expired(locale):
        logger.debug(f"Using cached translations for {locale}")
        return _custom_packs.get(locale, {})
    
    base_url = os.getenv('GITHUB_TRANSLATIONS_BASE_URL')
    if not base_url:
        logger.warning("GITHUB_TRANSLATIONS_BASE_URL not configured")
        return {}
    
    base_url = base_url.rstrip('/')
    
    try:
        timeout = int(os.getenv('CUSTOM_TRANSLATIONS_TIMEOUT', '10'))
    except ValueError:
        timeout = 10
        logger.warning("Invalid CUSTOM_TRANSLATIONS_TIMEOUT, using default: 10s")
    
    filenames = [f'custom_translations_{locale}.json', 'custom_translations.json']
    
    translations = {}
    for filename in filenames:
        url = f"{base_url}/{filename}"
        try:
            response = requests.get(
                url,
                timeout=timeout,
                headers={'User-Agent': 'Apache-Superset', 'Accept': 'application/json'}
            )
            
            if response.status_code == 200:
                translations = response.json()
                logger.info(f"Loaded {len(translations)} custom translations from {filename}")
                break
            elif response.status_code != 404:
                logger.warning(f"HTTP {response.status_code} for {filename}")
        
        except (requests.RequestException, json.JSONDecodeError) as e:
            logger.warning(f"Failed to load {filename}: {e}")
            continue
    
    _custom_packs[locale] = translations
    _cache_timestamps[locale] = time.time()
    
    return translations


def merge_with_custom_translations(locale: str, base_pack: dict[str, Any]) -> dict[str, Any]:
    """Merge base translations with custom translations from GitHub Pages."""

    custom_pack = get_language_pack_custom(locale)
    merged = _merge_translations(base_pack, custom_pack)
    
    if custom_pack:
        logger.info(
            f"Merged {locale}: {len(base_pack)} static + "
            f"{len(custom_pack)} custom = {len(merged)} total"
        )
    
    return merged
