// ModeSelection.tsx - 游戏模式选择界面

import { usePlayersList, myPlayer } from "playroomkit";

interface ModeSelectionProps {
  onSelectMode: (mode: "trigon" | "classic") => void;
}

export default function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  const players = usePlayersList();
  const me = myPlayer();
  // 使用与App.tsx相同的排序逻辑，确保一致性
  const sortedPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));
  const isHost = sortedPlayers.length > 0 && sortedPlayers[0].id === me?.id;

  if (!isHost) {
    return (
      <div className="mode-selection">
        <div className="mode-selection-content">
          <h2>等待初始玩家选择游戏模式</h2>
          <div className="waiting-spinner">⏳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mode-selection">
      <div className="mode-selection-content">
        <h2>选择游戏模式</h2>
        <div className="mode-options">
          <button
            className="mode-button classic-mode"
            onClick={() => onSelectMode("classic")}
          >
            <h3>经典正方形</h3>
            <p>20x20 棋盘，21 种棋子</p>
            <p>传统 Blokus 规则</p>
          </button>
          <button
            className="mode-button trigon-mode"
            onClick={() => onSelectMode("trigon")}
          >
            <h3>三角形变种</h3>
            <p>三角形网格，22 种棋子</p>
            <p>独特的三角形棋盘布局</p>
          </button>
        </div>
      </div>
    </div>
  );
}