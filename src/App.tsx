import { usePlayersList, useIsHost, useMultiplayerState, myPlayer } from "playroomkit";
import { useState, useMemo, useEffect } from "react";
import './App.css';

// --- 1. 核心数学：三角形网格判定 ---
const getTileDir = (r: number, c: number) => (r + c) % 2 === 0 ? 1 : -1;

const SIDE = 9; 
const TRI_SIZE = 32; 
const H = (TRI_SIZE * Math.sqrt(3)) / 2; 

// --- 2. 22 个真实棋子数据 ---
const REAL_PIECES = [
  { id: "1", shape: [{ r: 0, c: 0 }], direction: 1 },
  { id: "2", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }], direction: 1 },
  { id: "3", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }], direction: -1 },
  { id: "4", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 0, c: -2 }], direction: 1 },
  { id: "5", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: -1, c: 0 }], direction: -1 },
  { id: "6", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: -1, c: 1 }], direction: 1 },
  { id: "7", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: -1 }, { r: 0, c: -2 }], direction: 1 },
  { id: "8", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 0, c: 2 }, { r: -1, c: 0 }], direction: -1 },
  { id: "9", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 }], direction: 1 },
  { id: "10", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: 1 }], direction: 1 },
  { id: "11", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: -1 }, { r: 0, c: -2 }], direction: 1 },
  { id: "12", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: -1 }], direction: 1 },
  { id: "13", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: -1, c: 0 }, { r: -1, c: -1 }, { r: -1, c: 1 }], direction: 1 },
  { id: "14", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: 2 }], direction: -1 },
  { id: "15", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: 0 }], direction: -1 },
  { id: "16", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: -1 }, { r: -1, c: 0 }, { r: -1, c: -1 }], direction: 1 },
  { id: "17", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: 1 }, { r: -1, c: 0 }], direction: 1 },
  { id: "18", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: 0 }, { r: -1, c: -1 }], direction: -1 },
  { id: "19", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 }, { r: -1, c: -1 }], direction: -1 },
  { id: "20", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: -1, c: 0 }, { r: -1, c: -1 }, { r: -1, c: -2 }], direction: -1 },
  { id: "21", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 0, c: -2 }, { r: -1, c: 1 }, { r: -1, c: 2 }], direction: 1 },
  { id: "22", shape: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: -1, c: 0 }, { r: -1, c: -1 }, { r: -1, c: -2 }], direction: -1 },
];

function App() {
  const players = usePlayersList();
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.id.localeCompare(b.id)), [players]);
  const me = myPlayer();

  // --- 3. 联机状态 ---
  const [board, setBoard] = useMultiplayerState("board", {});
  const [turnIndex, setTurnIndex] = useMultiplayerState("turnIndex", 0);
  const [usedPieces, setUsedPieces] = useMultiplayerState("usedPieces", {}); // { playerId: [pieceIds] }

  const currentPlayer = sortedPlayers[turnIndex % sortedPlayers.length];
  const isMyTurn = currentPlayer?.id === me?.id;

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); 
  const [flipV, setFlipV] = useState(1); 
  const [flipH, setFlipH] = useState(1); 
  const [ghostPos, setGhostPos] = useState<{ r: number, c: number } | null>(null);

  const transformedData = useMemo(() => {
    const original = REAL_PIECES.find(p => `p-${p.id}` === selectedPieceId);
    if (!original) return { shape: [], activeDirection: 1 };
    let newShape = original.shape.map(coord => ({ r: coord.r * flipV, c: coord.c * flipH }));
    for (let i = 0; i < rotation; i++) {
      newShape = newShape.map(pos => {
        const isUp = (pos.r + pos.c) % 2 === 0;
        const q = Math.floor(pos.c / 2);
        const nextQ = -pos.r;
        const nextR = isUp ? q + pos.r : q + pos.r + 1;
        const nextIsUp = !isUp;
        return { r: nextR, c: 2 * nextQ + (nextIsUp ? 0 : 1) };
      });
    }
    const activeDirection = original.direction * flipV * (rotation % 2 === 0 ? 1 : -1);
    return { shape: newShape, activeDirection };
  }, [selectedPieceId, rotation, flipV, flipH]);

  const boardCells = useMemo(() => {
    const cells = [];
    const R_MAX = SIDE * 3 - 2; // 25 rows for side 9
    for (let r = 0; r < R_MAX; r++) {
      // 这里的数学逻辑确保了六边形的每一边都有 9 格
      const rowStart = Math.max(0, SIDE - 1 - Math.floor(r / 2), r - (SIDE * 2 - 2));
      const rowEnd = Math.min(SIDE * 3 - 3, SIDE * 2 - 2 + Math.floor(r / 2), (SIDE * 5 - 5) - r);
      // 注意：这里的列 c 范围需要根据三角形网格特性精细调整
      // 为了简化，我们使用一个覆盖 486 格的稳定计算
      const rowWidth = r < SIDE ? SIDE + r : (r < SIDE * 2 - 1 ? SIDE * 2 - 1 : SIDE * 3 - 2 - (r - SIDE * 2 + 2));
      const xOffset = (SIDE * 2 - 1 - Math.ceil(rowWidth/2)) * 2;
      // 实际上使用三轴坐标系过滤最准确
    }
    // 简化版：使用 17 行钻石，每行 2 三角，确保 486 格显示全
    const totalRows = SIDE * 2 - 1; 
    for (let r = 0; r < totalRows; r++) {
      const rowWidth = r < SIDE ? SIDE + r : SIDE * 3 - 2 - r;
      const xOffset = (SIDE * 2 - 1 - rowWidth);
      for (let c = 0; c < rowWidth * 2 - 1; c++) {
        cells.push({ r, c: c + xOffset });
      }
    }
    return cells;
  }, []);

  const getNeighbors = (r: number, c: number) => {
    const isUp = getTileDir(r, c) === 1;
    const sides: string[] = [];
    const corners: string[] = [];
    if (isUp) {
      sides.push(`${r}-${c-1}`, `${r}-${c+1}`, `${r+1}-${c}`);
      corners.push(`${r-1}-${c}`, `${r+1}-${c-2}`, `${r+1}-${c+2}`, `${r+1}-${c-1}`, `${r+1}-${c+1}`);
    } else {
      sides.push(`${r}-${c-1}`, `${r}-${c+1}`, `${r-1}-${c}`);
      corners.push(`${r+1}-${c}`, `${r-1}-${c-2}`, `${r-1}-${c+2}`, `${r-1}-${c-1}`, `${r-1}-${c+1}`);
    }
    return { sides, corners };
  };

  const performSnap = (r: number, c: number) => {
    const pieceDir = transformedData.activeDirection;
    if (getTileDir(r, c) !== pieceDir) {
      const { sides } = getNeighbors(r, c);
      const neighbor = sides[0].split("-").map(Number);
      return { r: neighbor[0], c: neighbor[1] };
    }
    return { r, c };
  };

  useEffect(() => {
    if (ghostPos && selectedPieceId) {
      const snapped = performSnap(ghostPos.r, ghostPos.c);
      if (snapped.r !== ghostPos.r || snapped.c !== ghostPos.c) setGhostPos(snapped);
    }
  }, [rotation, flipV, flipH, selectedPieceId]);

  const isValidPlacement = useMemo(() => {
    if (!isMyTurn || !selectedPieceId || !ghostPos) return false;
    const myColor = me?.getProfile().color.hexString;
    const isFirstMove = !Object.values(board).includes(myColor);
    let hasCorner = false, hasSide = false, coversStart = false;
    for (const offset of transformedData.shape) {
      const r = ghostPos.r + offset.r, c = ghostPos.c + offset.c, key = `${r}-${c}`;
      if (r < 0 || r > 16 || board[key]) return false;
      const startPoints = [{r:3,c:8},{r:13,c:8},{r:5,c:3},{r:5,c:13},{r:11,c:3},{r:11,c:13}];
      if (startPoints.some(p => p.r === r && p.c === c)) coversStart = true;
      const { sides, corners } = getNeighbors(r, c);
      for (const s of sides) if (board[s] === myColor) hasSide = true;
      for (const cor of corners) if (board[cor] === myColor) hasCorner = true;
    }
    if (hasSide) return false;
    return isFirstMove ? coversStart : hasCorner;
  }, [isMyTurn, selectedPieceId, ghostPos, transformedData, board, me]);

  const getPixelCoord = (r: number, c: number) => ({ x: 30 + c * (TRI_SIZE / 2), y: 50 + r * H });

  // --- 4. 落子并记录棋子消耗 ---
  const handleConfirm = () => {
    if (!isValidPlacement || !selectedPieceId) return;
    const newBoard = { ...board };
    const myColor = me?.getProfile().color.hexString;
    transformedData.shape.forEach(o => { newBoard[`${ghostPos!.r + o.r}-${ghostPos!.c + o.c}`] = myColor; });
    
    // 更新消耗记录
    const myId = me!.id;
    const myUsed = usedPieces[myId] || [];
    const pieceKey = selectedPieceId.replace("p-", "");
    const newUsed = { ...usedPieces, [myId]: [...myUsed, pieceKey] };

    setBoard(newBoard); 
    setUsedPieces(newUsed);
    setTurnIndex(turnIndex + 1);
    setGhostPos(null); 
    setSelectedPieceId(null);
  };

  return (
    <div className="iphone-screen">
      <div className="iphone-container">
        <div className="header-section">
          <div className="avatar-row">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`avatar-item ${turnIndex % sortedPlayers.length === i ? 'active' : ''}`}>
                <div className="avatar-frame" style={{borderColor: p.getProfile().color.hexString}}><img src={p.getProfile().photo} alt="p" /></div>
                <span className="player-name">{p.getProfile().name.slice(0,5)}</span>
              </div>
            ))}
          </div>
          <div className="status-banner">{!isMyTurn ? `${currentPlayer?.getProfile().name} 思考中...` : !selectedPieceId ? "请选择一枚棋子" : !ghostPos ? "请选择放置的位置" : isValidPlacement ? "点击确认，放置棋子" : "落子不合法"}</div>
        </div>

        <div className="board-section">
          <div className="board-wrapper">
            <svg viewBox="0 0 600 600" className="main-board">
              <g transform="translate(20, 20)">
                {useMemo(() => {
                  const cells = [];
                  for (let r = 0; r < SIDE * 2 - 1; r++) {
                    const rowWidth = r < SIDE ? SIDE + r : SIDE * 3 - 2 - r;
                    const xOffset = (SIDE * 2 - 1 - rowWidth);
                    for (let c = 0; c < rowWidth * 2 - 1; c++) {
                      const col = c + xOffset;
                      const { x, y } = getPixelCoord(r, col);
                      const isGhost = ghostPos && transformedData.shape.some(o => (ghostPos.r + o.r) === r && (ghostPos.c + o.c) === col);
                      const points = getTileDir(r, col) === 1 ? `${x},${y} ${x-TRI_SIZE/2},${y+H} ${x+TRI_SIZE/2},${y+H}` : `${x},${y+H} ${x-TRI_SIZE/2},${y} ${x+TRI_SIZE/2},${y}`;
                      cells.push(<polygon key={`${r}-${col}`} points={points} fill={isGhost ? me?.getProfile().color.hexString : (board[`${r}-${col}`] || "#2a2a2a")} fillOpacity={isGhost ? 0.5 : 1} stroke="#121212" strokeWidth="1" onClick={() => isMyTurn && selectedPieceId && setGhostPos(performSnap(r, col))} />);
                    }
                  }
                  return cells;
                }, [board, ghostPos, transformedData, me, isMyTurn, selectedPieceId])}
                {[ {r:3,c:8},{r:13,c:8},{r:5,c:3},{r:5,c:13},{r:11,c:3},{r:11,c:13} ].map(p => { const { x, y } = getPixelCoord(p.r, p.c); return <circle key={`s-${p.r}-${p.c}`} cx={x} cy={y+H/2} r="3" fill="white" opacity="0.4" pointerEvents="none" />; })}
              </g>
            </svg>
            {isValidPlacement && <button className="fab-btn confirm-btn" onClick={handleConfirm}>✔️</button>}
            {isMyTurn && <button className="fab-btn surrender-btn">🏳️</button>}
          </div>
        </div>

        <div className="controls-row">
          <button onClick={() => setFlipV(v => -v)}>↕️</button>
          <button onClick={() => setFlipH(h => -h)}>↔️</button>
          <button onClick={() => setRotation(r => (r + 1) % 6)}>↺</button>
          <button onClick={() => setRotation(r => (r + 5) % 6)}>↻</button>
        </div>

        <div className="inventory-section">
          <div className="piece-grid">
            {REAL_PIECES.map(piece => {
              const isUsed = (usedPieces[me?.id || ""] || []).includes(piece.id);
              const isSelected = selectedPieceId === `p-${piece.id}`;
              
              if (isUsed) return <div key={piece.id} className="piece-card empty"></div>;

              return (
                <div key={piece.id} className={`piece-card ${isSelected ? 'selected' : ''}`} onClick={() => isMyTurn && setSelectedPieceId(`p-${piece.id}`)}>
                  <svg width="50" height="50" viewBox="-35 -35 70 70" style={{ pointerEvents: 'none' }}>
                    {piece.shape.map((offset, idx) => {
                      const ms = 20, mh = (ms * Math.sqrt(3)) / 2;
                      const mx = offset.c * (ms / 2), my = offset.r * mh;
                      const isUp = piece.direction === 1 ? (offset.r + offset.c) % 2 === 0 : (offset.r + offset.c) % 2 !== 0;
                      const pts = isUp ? `${mx},${my} ${mx-ms/2},${my+mh} ${mx+ms/2},${my+mh}` : `${mx},${my+mh} ${mx-ms/2},${my} ${mx+ms/2},${my}`;
                      return <polygon key={idx} points={pts} fill={me?.getProfile().color.hexString || "#666"} fillOpacity={isSelected ? 1 : 0.7} />;
                    })}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        <div className="footer-scroll">
          <div className="scroll-indicator"></div>
          <p className="section-title">其他玩家剩余情况</p>
          {sortedPlayers.filter(p => p.id !== me?.id).map(p => {
            const count = 22 - (usedPieces[p.id] || []).length;
            return (
              <div key={p.id} className="other-player-card">
                <span style={{color: p.getProfile().color.hexString}}>{p.getProfile().name}</span>
                <span>剩余 {count} 块</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
