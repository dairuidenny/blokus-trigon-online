// GameBoard.tsx - 通用棋盘组件

import { myPlayer } from "playroomkit";
import { useRef, useCallback, useEffect } from "react";

interface GameBoardProps {
  mode: "trigon" | "classic";
  board: Record<string, string>;
  ghostPos: { r: number; c: number } | null;
  transformedData: { shape: { r: number; c: number }[]; activeDirection?: number };
  isMyTurn: boolean;
  selectedPieceId: string | null;
  onTileClick: (r: number, c: number) => void;
  onTileDrag?: (r: number, c: number) => void;
}

export default function GameBoard({
  mode,
  board,
  ghostPos,
  transformedData,
  isMyTurn,
  selectedPieceId,
  onTileClick,
  onTileDrag,
}: GameBoardProps) {
  const me = myPlayer();
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartInBoardRef = useRef(false);

  // 检测是否为触摸设备
  const isTouchDevice = useRef(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // 全局触摸事件处理，防止滚屏
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      // 如果正在拖动棋子，阻止所有触摸移动事件（包括滚屏）
      if (isDraggingRef.current && dragStartInBoardRef.current) {
        e.preventDefault();
      }
    };

    const handleGlobalTouchEnd = () => {
      // 触摸结束时重置状态
      isDraggingRef.current = false;
      dragStartInBoardRef.current = false;
    };

    // 添加被动事件监听器，但当需要时会调用preventDefault
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, []);

  // 坐标转换函数
  const getBoardCoordFromMouse = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;

    const svgRect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    const scaleX = viewBox.width / svgRect.width;
    const scaleY = viewBox.height / svgRect.height;

    const x = (clientX - svgRect.left) * scaleX + viewBox.x;
    const y = (clientY - svgRect.top) * scaleY + viewBox.y;

    if (mode === "classic") {
      const CELL_SIZE = 20;
      const r = Math.floor(y / CELL_SIZE);
      const c = Math.floor(x / CELL_SIZE);
      return { r, c };
    } else {
      // 三角模式坐标转换
      const TRI_SIZE = 32;
      const H = (TRI_SIZE * Math.sqrt(3)) / 2;
      const SIDE = 9;

      // 反向计算行列
      const row = Math.floor((y - 50) / H);
      if (row < 0 || row >= SIDE * 2) return null;

      const rowWidth = row < SIDE ? SIDE + row : SIDE * 3 - 1 - row;
      const xOffset = (SIDE * 2 - 1 - rowWidth);
      const col = Math.floor((x - 30) / (TRI_SIZE / 2)) - xOffset;

      if (col < 0 || col >= rowWidth * 2 + 1) return null;

      return { r: row, c: col };
    }
  }, [mode]);

  // 检查点是否在棋盘范围内 (简化版：检查是否在SVG元素内)
  const isPointInBoard = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return false;
    const rect = svgRef.current.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right &&
           clientY >= rect.top && clientY <= rect.bottom;
  }, []);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isMyTurn || !selectedPieceId || !ghostPos) return;

    dragStartInBoardRef.current = isPointInBoard(e.clientX, e.clientY);
    if (dragStartInBoardRef.current) {
      isDraggingRef.current = true;
      e.preventDefault(); // 防止文本选择等默认行为
    }
  }, [isMyTurn, selectedPieceId, ghostPos, isPointInBoard]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !onTileDrag) return;

    const coord = getBoardCoordFromMouse(e.clientX, e.clientY);
    if (coord) {
      onTileDrag(coord.r, coord.c);
    }
  }, [onTileDrag, getBoardCoordFromMouse]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartInBoardRef.current = false;
  }, []);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMyTurn || !selectedPieceId || !ghostPos) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragStartInBoardRef.current = isPointInBoard(touch.clientX, touch.clientY);
      isDraggingRef.current = true;
    }
  }, [isMyTurn, selectedPieceId, ghostPos, isPointInBoard]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !onTileDrag) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      let coord = getBoardCoordFromMouse(touch.clientX, touch.clientY);

      // 移动端拖动时，向上偏移3格以避免手指挡住
      if (coord && dragStartInBoardRef.current && isTouchDevice.current()) {
        coord = {
          r: Math.max(0, coord.r - 4), // 向上偏移4格，最小为0
          c: coord.c
        };
      }

      // 全局事件监听器会处理滚屏阻止，这里只处理拖动逻辑
      if (coord) {
        onTileDrag(coord.r, coord.c);
      }
    }
  }, [onTileDrag, getBoardCoordFromMouse]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    dragStartInBoardRef.current = false;
  }, []);

  const renderTrigonBoard = () => {
    const SIDE = 9;
    const TRI_SIZE = 32;
    const H = (TRI_SIZE * Math.sqrt(3)) / 2;

    const getTileDir = (r: number, c: number) => (r + c) % 2 === 0 ? 1 : -1;
    const getPixelCoord = (r: number, c: number) => ({
      x: 30 + c * (TRI_SIZE / 2),
      y: 50 + r * H,
    });

    const cells = [];
    for (let r = 0; r < SIDE * 2; r++) {
      const rowWidth = r < SIDE ? SIDE + r : SIDE * 3 - 1 - r;
      const xOffset = (SIDE * 2 - 1 - rowWidth);
      for (let c = 0; c < rowWidth * 2 + 1; c++) {
        const col = c + xOffset;
        const { x, y } = getPixelCoord(r, col);
        const isGhost = ghostPos && transformedData.shape.some(
          (o) => ghostPos.r + o.r === r && ghostPos.c + o.c === col
        );
        const points = getTileDir(r, col) === 1
          ? `${x},${y} ${x - TRI_SIZE / 2},${y + H} ${x + TRI_SIZE / 2},${y + H}`
          : `${x},${y + H} ${x - TRI_SIZE / 2},${y} ${x + TRI_SIZE / 2},${y}`;
        cells.push(
          <polygon
            key={`${r}-${col}`}
            points={points}
            fill={isGhost ? me?.getProfile().color.hexString : board[`${r}-${col}`] || "#2a2a2a"}
            fillOpacity={isGhost ? 0.5 : 1}
            stroke="#121212"
            strokeWidth="1"
            onClick={() => {
              if (!isDraggingRef.current && isMyTurn && selectedPieceId) {
                onTileClick(r, col);
              }
            }}
          />
        );
      }
    }

    // 起始点
    const startPoints = [
      { r: 3, c: 17 },
      { r: 6, c: 9 },
      { r: 6, c: 25 },
      { r: 11, c: 9 },
      { r: 11, c: 25 },
      { r: 14, c: 17 },
    ];
    const startCircles = startPoints.map((p) => {
      const { x, y } = getPixelCoord(p.r, p.c);
      return (
        <circle
          key={`s-${p.r}-${p.c}`}
          cx={x}
          cy={y + (getTileDir(p.r, p.c) === 1 ? (H * 2) / 3 : H / 3)}
          r="3"
          fill="white"
          opacity="0.4"
          pointerEvents="none"
        />
      );
    });

    return (
      <svg
        ref={svgRef}
        viewBox="0 36 600 526"
        className="main-board"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <g transform="translate(0, 0)">
          {cells}
          {startCircles}
        </g>
      </svg>
    );
  };

  const renderClassicBoard = () => {
    const BOARD_SIZE = 20;
    const CELL_SIZE = 20;

    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const isGhost = ghostPos && transformedData.shape.some(
          (o) => ghostPos.r + o.r === r && ghostPos.c + o.c === c
        );
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * CELL_SIZE}
            y={r * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={isGhost ? me?.getProfile().color.hexString : board[`${r}-${c}`] || "#2a2a2a"}
            fillOpacity={isGhost ? 0.5 : 1}
            stroke="#121212"
            strokeWidth="1"
            onClick={() => {
              if (!isDraggingRef.current && isMyTurn && selectedPieceId) {
                onTileClick(r, c);
              }
            }}
          />
        );
      }
    }

    // 起始点 (四个角落)
    const startPoints = [
      { r: 0, c: 0 },
      { r: 0, c: 19 },
      { r: 19, c: 0 },
      { r: 19, c: 19 },
    ];
    const startCircles = startPoints.map((p) => (
      <circle
        key={`s-${p.r}-${p.c}`}
        cx={p.c * CELL_SIZE + CELL_SIZE / 2}
        cy={p.r * CELL_SIZE + CELL_SIZE / 2}
        r="3"
        fill="white"
        opacity="0.4"
        pointerEvents="none"
      />
    ));

    return (
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        className="main-board"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <g>
          {cells}
          {startCircles}
        </g>
      </svg>
    );
  };

  return (
    <div className="board-wrapper">
      {mode === "trigon" ? renderTrigonBoard() : renderClassicBoard()}
    </div>
  );
}