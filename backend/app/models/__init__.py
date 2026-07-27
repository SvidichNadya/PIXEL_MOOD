# Импортируем все модели, чтобы они были зарегистрированы в метаданных
from app.models.user import User
from app.models.calendar import Calendar
from app.models.mood import Mood
from app.models.reaction import Reaction
from app.models.payment import Payment
from app.models.daily_stat import DailyStat
from app.models.notification import Notification
from app.models.support import SupportRequest
