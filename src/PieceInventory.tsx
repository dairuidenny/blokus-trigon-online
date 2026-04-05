// PieceInventory.tsx - 棋子库存组件

import { myPlayer } from "playroomkit";
import { REAL_PIECES } from "./App";
import { CLASSIC_PIECES } from "./ClassicPieces";

interface PieceInventoryProps {
  mode: "trigon" | "classic";
  usedPieces: Record<string, string[]>;
  selectedPieceId: string | null;
  isMyTurn: boolean;
  onSelectPiece: (pieceId: string) => void;
}

export default function PieceInventory({
  mode,
  usedPieces,
  selectedPieceId,
  isMyTurn,
  onSelectPiece,
}: PieceInventoryProps) {
  const me = myPlayer();
  const pieces = mode === "trigon" ? REAL_PIECES : CLASSIC_PIECES;

  const renderPiece = (piece: any, isUsed: boolean, isSelected: boolean) => {
    if (isUsed) return <div key={piece.id} className="piece-card empty"></div>;

    return (
      <div
        key={piece.id}
        className={`piece-card ${isSelected ? "selected" : ""}`}
        onClick={() => isMyTurn && onSelectPiece(`p-${piece.id}`)}
      >
        <svg width="50" height="50" viewBox="-40 -30 80 60" style={{ pointerEvents: "none" }}>
          {piece.shape.map((offset: { r: number; c: number }, idx: number) => {
            if (mode === "trigon") {
              // 三角形渲染逻辑（放大 1.1 倍）
              const scale = 1.1;
              const ms = 20 * scale,
                mh = (ms * Math.sqrt(3)) / 2;
              const mx = offset.c * (ms / 2),
                my = offset.r * mh;
              const isUp = (piece as any).direction === 1
                ? (offset.r + offset.c) % 2 === 0
                : (offset.r + offset.c) % 2 !== 0;
              const pts = isUp
                ? `${mx},${my} ${mx - ms / 2},${my + mh} ${mx + ms / 2},${my + mh}`
                : `${mx},${my + mh} ${mx - ms / 2},${my} ${mx + ms / 2},${my}`;
              return (
                <polygon
                  key={idx}
                  points={pts}
                  fill={me?.getProfile().color.hexString || "#666"}
                  fillOpacity={isSelected ? 1 : 0.7}
                  stroke="#333"
                  strokeWidth="1"
                />
              );
            } else {
              // 正方形渲染逻辑（放大 2 倍）
              const scale = 2;
              const size = 8 * scale;
              return (
                <rect
                  key={idx}
                  x={offset.c * size - size / 2}
                  y={offset.r * size - size / 2}
                  width={size}
                  height={size}
                  fill={me?.getProfile().color.hexString || "#666"}
                  fillOpacity={isSelected ? 1 : 0.7}
                  stroke="#333"
                  strokeWidth="1"
                />
              );
            }
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="inventory-section">
      <div className="piece-grid">
        {pieces.map((piece) => {
          const isUsed = (usedPieces[me?.id || ""] || []).includes(piece.id);
          const isSelected = selectedPieceId === `p-${piece.id}`;
          return renderPiece(piece, isUsed, isSelected);
        })}
      </div>
    </div>
  );
}