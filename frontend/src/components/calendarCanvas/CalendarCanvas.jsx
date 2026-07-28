import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const CELL_SIZE = 4;
const GAP = 1;
const CELL_WITH_GAP = CELL_SIZE + GAP;

const CalendarCanvas = ({
  pixels = [],
  width = 600,
  height = 600,
  onPixelClick,
  onPixelHover,
  selectedPixelIndex = null,
  loading = false,
  interactive = true,
  showDate = true,
  date = new Date(),
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(width);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Расчёт количества ячеек
  const cols = Math.floor(width / CELL_WITH_GAP);
  const rows = Math.floor(height / CELL_WITH_GAP);
  const totalCells = cols * rows;

  // Строим карту позиций для быстрого поиска пикселя по позиции
  const pixelMap = React.useMemo(() => {
    const map = new Map();
    pixels.forEach(p => {
      if (p.position !== undefined && p.position !== null) {
        map.set(p.position, p);
      }
    });
    return map;
  }, [pixels]);

  // Адаптация под размер контейнера
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width: containerWidth } = entry.contentRect;
        setContainerWidth(containerWidth);
        drawCanvas();
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [width, pixels]);

  // Отрисовка канваса
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Вычисляем размеры для отображения
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * (height / width);

    // Устанавливаем внутреннее разрешение (для чёткости)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Масштабируем контекст для DPR
    ctx.scale(dpr, dpr);

    // Очистка
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Фон — исходный цвет
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Рисуем сетку (слабая, для ориентации)
    ctx.strokeStyle = 'rgba(45, 45, 68, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      const x = i * (CELL_SIZE + GAP) * (displayWidth / width) + GAP / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      const y = i * (CELL_SIZE + GAP) * (displayHeight / height) + GAP / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    // Рисуем пиксели по их позициям
    const cellSize = CELL_SIZE * (displayWidth / width);
    const gap = GAP * (displayWidth / width);

    // Проходим по всем ячейкам
    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (cellSize + gap) + gap / 2;
      const y = row * (cellSize + gap) + gap / 2;

      const pixel = pixelMap.get(i);

      if (pixel) {
        // Рисуем пиксель
        const color = pixel.color || '#232334';
        ctx.fillStyle = color;

        if (pixel.isNew) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }

        const radius = 1;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + cellSize - radius, y);
        ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + radius);
        ctx.lineTo(x + cellSize, y + cellSize - radius);
        ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - radius, y + cellSize);
        ctx.lineTo(x + radius, y + cellSize);
        ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Подсветка выбранного пикселя
        if (i === selectedPixelIndex || i === hoveredIndex) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#ffffff';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 1, y - 1, cellSize + 2, cellSize + 2);
          ctx.shadowBlur = 0;
        }
      } else {
        // Пустая ячейка
        ctx.fillStyle = 'rgba(45, 45, 68, 0.4)';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Дата на канвасе (если нужно)
    if (showDate) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = `${displayWidth * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const dateStr = format(date, 'd MMMM yyyy', { locale: ru });
      ctx.fillText(dateStr, displayWidth / 2, displayHeight - 8);
    }
  };

  // Обработчики событий
  const getPixelIndexFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;

    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    const x = ((e.clientX - rect.left) / displayWidth) * width;
    const y = ((e.clientY - rect.top) / displayHeight) * height;

    const col = Math.floor(x / CELL_WITH_GAP);
    const row = Math.floor(y / CELL_WITH_GAP);
    const index = row * cols + col;

    if (index >= 0 && index < totalCells) {
      return index;
    }
    return -1;
  };

  const handleClick = (e) => {
    if (!interactive) return;
    const index = getPixelIndexFromEvent(e);
    if (index >= 0) {
      const pixel = pixelMap.get(index) || null;
      onPixelClick(pixel, index);
    }
  };

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const index = getPixelIndexFromEvent(e);
    if (index !== hoveredIndex) {
      setHoveredIndex(index);
      if (onPixelHover) {
        onPixelHover(index >= 0 ? pixelMap.get(index) || null : null, index);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    if (onPixelHover) {
      onPixelHover(null, -1);
    }
  };

  // Перерисовка при изменении данных
  useEffect(() => {
    drawCanvas();
  }, [pixels, width, height, containerWidth, selectedPixelIndex, hoveredIndex]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[600px] mx-auto">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full h-auto rounded-xl cursor-${interactive ? 'pointer' : 'default'} transition-opacity duration-300 ${
          loading ? 'opacity-50' : 'opacity-100'
        }`}
        style={{ aspectRatio: `${width} / ${height}` }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default CalendarCanvas;