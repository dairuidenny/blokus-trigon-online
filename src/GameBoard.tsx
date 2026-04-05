// GameBoard.tsx - 通用棋盘组件

import { myPlayer } from "playroomkit";

interface GameBoardProps {
  mode: "trigon" | "classic";
  board: Record<string, string>;
  ghostPos: { r: number; c: number } | null;
  transformedData: { shape: { r: number; c: number }[]; activeDirection?: number };
  isMyTurn: boolean;
  selectedPieceId: string | null;
  onTileClick: (r: number, c: number) => void;
}

export default function GameBoard({
  mode,
  board,
  ghostPos,
  transformedData,
  isMyTurn,
  selectedPieceId,
  onTileClick,
}: GameBoardProps) {
  const me = myPlayer();

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
            onClick={() => isMyTurn && selectedPieceId && onTileClick(r, col)}
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
      <svg viewBox="0 36 600 526" className="main-board">
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
            onClick={() => isMyTurn && selectedPieceId && onTileClick(r, c)}
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
      <svg viewBox="0 0 400 400" className="main-board">
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