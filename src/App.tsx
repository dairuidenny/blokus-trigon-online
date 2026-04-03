import { usePlayersList, useMultiplayerState, myPlayer } from "playroomkit";
import { useState, useMemo, useEffect } from "react";
import './App.css';

// --- 类型定义 ---
type BoardState = Record<string, string>;
type UsedPiecesState = Record<string, string[]>;
type CubeCoord = { x: number; y: number; z: number };
type DoubledCoord = { r: number; c: number };

// --- 1. 立方体坐标系统 ---
// 朝上三角形: x + y + z = 0
// 朝下三角形: x + y + z = -1

const doubledToCube = (r: number, c: number): CubeCoord => {
  const isUp = (r + c) % 2 === 0;
  if (isUp) {
    const x = c / 2;
    const z = r;
    const y = -x - z;
    return { x, y, z };
  } else {
    const x = (c - 1) / 2;
    const z = r;
    const y = -x - z - 1;
    return { x, y, z };
  }
};

const cubeToDoubled = (cube: CubeCoord): DoubledCoord => {
  const r = Math.round(cube.z);
  const isUp = Math.abs(cube.x + cube.y + cube.z) < 0.5;
  const c = isUp ? Math.round(2 * cube.x) : Math.round(2 * cube.x + 1);
  return { r, c };
};

const rotateCubeCW = (cube: CubeCoord): CubeCoord => {
  return { x: -cube.z, y: -cube.x, z: -cube.y };
};

const flipHCube = (cube: CubeCoord): CubeCoord => {
  return { x: cube.z, y: cube.y, z: cube.x };
};

const flipVCube = (cube: CubeCoord): CubeCoord => {
  return { x: cube.x, y: cube.z, z: cube.y };
};

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
  const [board, setBoard] = useMultiplayerState<BoardState>("board", {});
  const [turnIndex, setTurnIndex] = useMultiplayerState("turnIndex", 0);
  const [usedPieces, setUsedPieces] = useMultiplayerState<UsedPiecesState>("usedPieces", {}); // { playerId: [pieceIds] }

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
    
    // 将 Doubled coordinates 转换为 Cube coordinates
    let cubeShape = original.shape.map(coord => doubledToCube(coord.r, coord.c));
    
    // 应用翻转
    if (flipH === -1) {
      cubeShape = cubeShape.map(c => flipHCube(c));
    }
    if (flipV === -1) {
      cubeShape = cubeShape.map(c => flipVCube(c));
    }
    
    // 应用旋转（在立方体坐标系中简单优雅）
    for (let i = 0; i < rotation; i++) {
      cubeShape = cubeShape.map(c => rotateCubeCW(c));
    }
    
    // 转换回 Doubled coordinates
    const shape = cubeShape.map(c => cubeToDoubled(c));
    
    // 计算最终方向（原始方向 × 翻转 × 旋转）
    const activeDirection = original.direction * flipV * (rotation % 2 === 0 ? 1 : -1);
    return { shape, activeDirection };
  }, [selectedPieceId, rotation, flipV, flipH]);

  const getNeighbors = (r: number, c: number) => {
    // 转换到立方体坐标计算邻居
    const cube = doubledToCube(r, c);
    const isUp = cube.x + cube.y + cube.z > -0.5; // 朝上三角形
    
    let edgeNeighbors: CubeCoord[] = [];
    let cornerNeighbors: CubeCoord[] = [];
    
    if (isUp) {
      // 朝上三角形的3个边邻居和6个角邻居
      edgeNeighbors = [
        { x: cube.x + 1, y: cube.y - 1, z: cube.z },      // 右下
        { x: cube.x - 1, y: cube.y + 1, z: cube.z },      // 左下
        { x: cube.x, y: cube.y, z: cube.z + 1 }           // 上
      ];
      cornerNeighbors = [
        { x: cube.x + 1, y: cube.y, z: cube.z - 1 },      // 右
        { x: cube.x - 1, y: cube.y, z: cube.z - 1 },      // 左
        { x: cube.x, y: cube.y + 1, z: cube.z - 1 },      // 左上
        { x: cube.x, y: cube.y - 1, z: cube.z - 1 },      // 右上
        { x: cube.x + 1, y: cube.y - 1, z: cube.z + 1 },  // 右下角
        { x: cube.x - 1, y: cube.y + 1, z: cube.z + 1 }   // 左下角
      ];
    } else {
      // 朝下三角形的3个边邻居和6个角邻居
      edgeNeighbors = [
        { x: cube.x + 1, y: cube.y - 1, z: cube.z },      // 右上
        { x: cube.x - 1, y: cube.y + 1, z: cube.z },      // 左上
        { x: cube.x, y: cube.y, z: cube.z - 1 }           // 下
      ];
      cornerNeighbors = [
        { x: cube.x + 1, y: cube.y, z: cube.z + 1 },      // 右
        { x: cube.x - 1, y: cube.y, z: cube.z + 1 },      // 左
        { x: cube.x, y: cube.y + 1, z: cube.z + 1 },      // 左下
        { x: cube.x, y: cube.y - 1, z: cube.z + 1 },      // 右下
        { x: cube.x + 1, y: cube.y - 1, z: cube.z - 1 },  // 右上角
        { x: cube.x - 1, y: cube.y + 1, z: cube.z - 1 }   // 左上角
      ];
    }
    
    // 转换回 Doubled coordinates
    const sides = edgeNeighbors.map(c => {
      const { r: nr, c: nc } = cubeToDoubled(c);
      return `${nr}-${nc}`;
    });
    const corners = cornerNeighbors.map(c => {
      const { r: nr, c: nc } = cubeToDoubled(c);
      return `${nr}-${nc}`;
    });
    
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
    const isFirstMove = !Object.values(board).includes(myColor || "");
    
    let hasCorner = false, hasSide = false, coversStart = false;
    for (const offset of transformedData.shape) {
      const r = ghostPos.r + offset.r, c = ghostPos.c + offset.c, key = `${r}-${c}`;
      if (r < 0 || r > 16 || board[key]) return false;
      const startPoints = [{r:3,c:17},{r:6,c:9},{r:6,c:25},{r:11,c:9},{r:11,c:25},{r:14,c:17}];
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
    if (!isValidPlacement || !selectedPieceId || !me) return;
    const newBoard = { ...board };
    const myColor = me.getProfile().color.hexString;
    transformedData.shape.forEach(o => { 
      const r = ghostPos!.r + o.r;
      const c = ghostPos!.c + o.c;
      newBoard[`${r}-${c}`] = myColor; 
    });
    
    // 更新消耗记录
    const myId = me.id;
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
          <div className="status-banner">{!isMyTurn ? `${currentPlayer?.getProfile().name} 思考中...` : !selectedPieceId ? "请选择一枚棋子" : !ghostPos ? "请选择放置的位置" : isValidPlacement ? "点击✅️，放置棋子" : "⚠️落子不合法"}</div>
        </div>

        <div className="board-section">
          <div className="board-wrapper">
            <svg viewBox="0 0 600 600" className="main-board">
              <g transform="translate(0, 0)">
                {useMemo(() => {
                  const cells = [];
                  for (let r = 0; r < SIDE * 2; r++) {
                    const rowWidth = r < SIDE ? SIDE + r : SIDE * 3 - 1 - r;
                    const xOffset = (SIDE * 2 - 1 - rowWidth);
                    for (let c = 0; c < rowWidth * 2 + 1; c++) {
                      const col = c + xOffset;
                      const { x, y } = getPixelCoord(r, col);
                      const isGhost = ghostPos && transformedData.shape.some(o => (ghostPos.r + o.r) === r && (ghostPos.c + o.c) === col);
                      const points = getTileDir(r, col) === 1 ? `${x},${y} ${x-TRI_SIZE/2},${y+H} ${x+TRI_SIZE/2},${y+H}` : `${x},${y+H} ${x-TRI_SIZE/2},${y} ${x+TRI_SIZE/2},${y}`;
                      cells.push(<polygon key={`${r}-${col}`} points={points} fill={isGhost ? me?.getProfile().color.hexString : (board[`${r}-${col}`] || "#2a2a2a")} fillOpacity={isGhost ? 0.5 : 1} stroke="#121212" strokeWidth="1" onClick={() => isMyTurn && selectedPieceId && setGhostPos(performSnap(r, col))} />);
                    }
                  }
                  return cells;
                }, [board, ghostPos, transformedData, me, isMyTurn, selectedPieceId])}
                {[{r:3,c:17},{r:6,c:9},{r:6,c:25},{r:11,c:9},{r:11,c:25},{r:14,c:17}].map(p => { const { x, y } = getPixelCoord(p.r, p.c); return <circle key={`s-${p.r}-${p.c}`} cx={x} cy={y+ (getTileDir(p.r, p.c) === 1 ? (H*2/3) : (H/3))} r="3" fill="white" opacity="0.4" pointerEvents="none" />; })}
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
