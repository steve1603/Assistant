import os
import logging
import colorlog
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "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")

# Models
CLAUDE_MODEL = "claude-3-opus-20240229"
OPENAI_MODEL = "gpt-4o"

# Agent settings
SYSTEM_NAME = "DevTeamAgents"
MAX_TOKENS = 2000
TEMPERATURE = 0.7

# Logging configuration
def setup_logger():
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    numeric_level = getattr(logging, log_level, logging.INFO)
    
    handler = colorlog.StreamHandler()
    handler.setFormatter(colorlog.ColoredFormatter(
        '%(log_color)s%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    ))
    
    logger = logging.getLogger(SYSTEM_NAME)
    logger.setLevel(numeric_level)
    logger.addHandler(handler)
    
    return logger

LOGGER = setup_logger() 