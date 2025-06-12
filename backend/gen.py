# generate_schema.py
from sqlalchemy import create_engine
from sqlalchemy_schemadisplay import create_schema_graph
from app.db.base import Base

# Локальное подключение к БД (через проброшенный порт!)
engine = create_engine("postgresql://backlog_user:backlog_super_secure_password_2024@localhost:5433/student_planner")

# Привязываем engine к Base, если он еще не инициализирован
Base.metadata.bind = engine

# Генерация схемы
graph = create_schema_graph(
    engine=engine,
    metadata=Base.metadata,
    show_datatypes=True,
    show_indexes=True,
    rankdir='LR',
    concentrate=False
)

graph.write_png("student_planner_schema.png")
print("✅ ER-диаграмма успешно создана.")
