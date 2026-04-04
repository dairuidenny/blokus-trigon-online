import { usePlayersList, useMultiplayerState, myPlayer } from "playroomkit";
import { useState, useMemo, useEffect } from "react";
import './App.css';

// --- 类型定义 ---
type BoardState = Record<string, string>;
type UsedPiecesState = Record<string, string[]>;

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
  const [board, setBoard] = useMultiplayerState<BoardState>("board", {});
  const [turnIndex, setTurnIndex] = useMultiplayerState("turnIndex", 0);
  const [usedPieces, setUsedPieces] = useMultiplayerState<UsedPiecesState>("usedPieces", {}); // { playerId: [pieceIds] }
  const [skippedPlayers, setSkippedPlayers] = useMultiplayerState<Record<string, boolean>>("skippedPlayers", {}); // 跳过玩家
  const [gameEnded, setGameEnded] = useMultiplayerState("gameEnded", false);

  const currentPlayer = sortedPlayers[turnIndex % sortedPlayers.length];
  const isMyTurn = currentPlayer?.id === me?.id && !gameEnded;

  // 自动跳过被跳过的玩家或已用完棋子的玩家
  useEffect(() => {
    if (gameEnded) return;
    
    const currentIndex = turnIndex % sortedPlayers.length;
    const currentPlayer = sortedPlayers[currentIndex];
    if (!currentPlayer) return;
    
    const usedCount = (usedPieces[currentPlayer.id] || []).length;
    const isSkipped = skippedPlayers[currentPlayer.id];
    const isFinished = usedCount === 22;
    
    // 如果当前玩家已用完所有棋子但还没标记为跳过，自动标记为跳过
    if (isFinished && !isSkipped) {
      const newSkipped = { ...skippedPlayers, [currentPlayer.id]: true };
      setSkippedPlayers(newSkipped);
      // 检查是否所有玩家都被跳过
      if (sortedPlayers.every(p => newSkipped[p.id])) {
        setGameEnded(true);
      }
    }
    // 如果当前玩家被跳过，自动跳过到下一个玩家
    else if (isSkipped) {
      setTurnIndex(turnIndex + 1);
    }
  }, [turnIndex, sortedPlayers, skippedPlayers, usedPieces, gameEnded]);

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); 
  const [flipV, setFlipV] = useState(1); 
  const [flipH, setFlipH] = useState(1); 
  const [ghostPos, setGhostPos] = useState<{ r: number, c: number } | null>(null);

  const transformedData = useMemo(() => {
    const original = REAL_PIECES.find(p => `p-${p.id}` === selectedPieceId);
    if (!original) return { shape: [], activeDirection: 1 };
    let newShape = original.shape.map(coord => ({ r: coord.r * flipV, c: coord.c * flipH }));
    const activeDirection = original.direction * flipV * (rotation % 2 === 0 ? 1 : -1);
    const cx_offset = H / 3 * ((original.direction * flipV === 1) ? -1 : 1);
    newShape = newShape.map(pos => {
      const cx = pos.r * H + ((pos.r % 2 === pos.c % 2)? 0 : cx_offset);
      const cy = pos.c * 0.5 * TRI_SIZE;
      const cx_new = cx * Math.cos(Math.PI / 3 * rotation) - cy * Math.sin(Math.PI / 3 * rotation);
      const cy_new = cx * Math.sin(Math.PI / 3 * rotation) + cy * Math.cos(Math.PI / 3 * rotation);
      return { r: Math.floor(cx_new / H + 0.5), c: Math.floor(cy_new / (0.5 * TRI_SIZE) + 0.5) };
    }
    );
    return { shape: newShape, activeDirection };
  }, [selectedPieceId, rotation, flipV, flipH]);

  const getNeighbors = (r: number, c: number) => {
    const isUp = getTileDir(r, c) === 1;
    const sides: string[] = [];
    const corners: string[] = [];
    if (isUp) {
      sides.push(`${r}-${c-1}`, `${r}-${c+1}`, `${r+1}-${c}`);
      corners.push(`${r-1}-${c}`,`${r-1}-${c-1}`,`${r-1}-${c+1}`,`${r}-${c-2}`,`${r}-${c+2}`, `${r+1}-${c-2}`, `${r+1}-${c+2}`, `${r+1}-${c-1}`, `${r+1}-${c+1}`);
    } else {
      sides.push(`${r}-${c-1}`, `${r}-${c+1}`, `${r-1}-${c}`);
      corners.push(`${r+1}-${c}`,`${r+1}-${c-1}`,`${r+1}-${c+1}`,`${r}-${c-2}`,`${r}-${c+2}`, `${r-1}-${c-2}`, `${r-1}-${c+2}`, `${r-1}-${c-1}`, `${r-1}-${c+1}`);
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
    if (!isMyTurn || !selectedPieceId || !ghostPos) return { valid: false, reason: 0 };
    const myColor = me?.getProfile().color.hexString;
    const isFirstMove = !Object.values(board).includes(myColor || "");
    
    let invalidCondition = 0;
    let hasCorner = false, coversStart = false;
    for (const offset of transformedData.shape) {
      const r = ghostPos.r + offset.r, c = ghostPos.c + offset.c, key = `${r}-${c}`;
      if (board[key]){
        invalidCondition = 1; // 与已有棋子重叠
        break;
      }
      // 检查棋盘边界（上下左右）
      if (r < 0 || r > 17 || c < (r < 9 ? 8 - r : r - 9) || c > (r < 9 ? r + 26 : 43 - r)) {
        invalidCondition = 2; // 超出棋盘边界
        break;
      }
      if (isFirstMove){
        const startPoints = [{r:3,c:17},{r:6,c:9},{r:6,c:25},{r:11,c:9},{r:11,c:25},{r:14,c:17}];
        if (startPoints.some(p => p.r === r && p.c === c)){
          coversStart = true;
        }
      }
      const { sides, corners } = getNeighbors(r, c);
      for (const s of sides){
        if (board[s] === myColor){
          invalidCondition = 4; // 与己方棋子边接
          break;
        }
      }
      if (invalidCondition > 0) break;
      for (const cor of corners){
        if (board[cor] === myColor){
          hasCorner = true;
        }
      }
    }
    if (invalidCondition === 0) {
      if (isFirstMove && !coversStart){
        invalidCondition = 3; // 第一手必须覆盖起始点
      }
      else if (!isFirstMove && !hasCorner){
        invalidCondition = 5; // 没有与己方棋子角接
      }
    }
    return { valid: invalidCondition === 0, reason: invalidCondition };
  }, [isMyTurn, selectedPieceId, ghostPos, transformedData, board, me]);

  const getPixelCoord = (r: number, c: number) => ({ x: 30 + c * (TRI_SIZE / 2), y: 50 + r * H });

  // --- 4. 落子并记录棋子消耗 ---
  const handleConfirm = () => {
    if (!isValidPlacement.valid || !selectedPieceId || !me) return;
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

  const handleRestart = () => {
    // 只有房主（第一个玩家）可以重新开始游戏
    if (!me || sortedPlayers[0]?.id !== me.id) return;
    
    const confirmed = window.confirm("确定要重新开始游戏吗？所有进度将被重置。");
    if (confirmed) {
      // 重置所有游戏状态
      setBoard({});
      setTurnIndex(0);
      setUsedPieces({});
      setSkippedPlayers({});
      setGameEnded(false);
      
      // 重置本地状态
      setSelectedPieceId(null);
      setRotation(0);
      setFlipV(1);
      setFlipH(1);
      setGhostPos(null);
    }
  };

  const handleSurrender = () => {
    if (!me || !isMyTurn) return;
    const confirmed = window.confirm("确定要放弃本回合吗？之后轮到您时将自动跳过。");
    if (confirmed) {
      const newSkipped = { ...skippedPlayers, [me.id]: true };
      setSkippedPlayers(newSkipped);
      setTurnIndex(turnIndex + 1);
      setSelectedPieceId(null);
      setGhostPos(null);
    }
  };

  // 检查游戏是否结束
  const gameStatus = useMemo(() => {
    if (gameEnded) return { ended: true };
    
    const allPlayersSkipped = sortedPlayers.every(p => skippedPlayers[p.id]);
    
    if (allPlayersSkipped) {
      setGameEnded(true);
      return { ended: true };
    }
    
    return { ended: false };
  }, [sortedPlayers, skippedPlayers, gameEnded]);

  // 计算得分
  const scores = useMemo(() => {
    if (!gameStatus.ended) return {};
    
    const result: Record<string, { score: number, pieces: number }> = {};
    sortedPlayers.forEach(p => {
      const usedCount = (usedPieces[p.id] || []).length;
      const remainingPieces = 22 - usedCount;
      let score = 0;
      
      if (remainingPieces === 0) {
        score = 15; // 全部下完得15分
      } else {
        // 计算剩余棋子的总格子数
        const remainingPieceIds = REAL_PIECES.filter(piece => !usedPieces[p.id]?.includes(piece.id));
        const totalCells = remainingPieceIds.reduce((sum, piece) => sum + piece.shape.length, 0);
        score = -totalCells; // 每个格子减一分
      }
      
      result[p.id] = { score, pieces: remainingPieces };
    });
    
    return result;
  }, [gameStatus.ended, sortedPlayers, usedPieces]);

  const winner = useMemo((): typeof sortedPlayers[0] | null => {
    if (!gameStatus.ended) return null;
    let maxScore = -Infinity;
    let winnerPlayer: typeof sortedPlayers[0] | null = null;
    sortedPlayers.forEach(p => {
      const score = scores[p.id]?.score || 0;
      if (score > maxScore) {
        maxScore = score;
        winnerPlayer = p;
      }
    });
    return winnerPlayer;
  }, [gameStatus.ended, scores, sortedPlayers]);

  return (
    <div className="iphone-screen">
      <div className="iphone-container">
        <div className="header-section">
          <div className="avatar-row">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`avatar-item ${turnIndex % sortedPlayers.length === i && !gameEnded ? 'active' : ''}`}>
                <div className="avatar-frame" style={{borderColor: p.getProfile().color.hexString}}>
                  <img src={p.getProfile().photo} alt="p" />
                </div>
                <span className="player-name">{p.getProfile().name.slice(0,5)}</span>
                {gameEnded && scores[p.id] && (
                  <div className="score-display">
                    <div>剩余: {scores[p.id].pieces}块</div>
                    <div>得分: {scores[p.id].score}</div>
                    {winner && winner.id === p.id && <div className="winner-crown">👑</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="status-banner">
            {gameEnded ? 
              `游戏结束！${winner ? winner.getProfile().name : '未知玩家'} 获胜！` :
              (!isMyTurn ? `${currentPlayer?.getProfile().name} 思考中...` : 
              !selectedPieceId ? "请选择一枚棋子" : 
              !ghostPos ? "请选择放置的位置" : 
              isValidPlacement.valid ? "点击✅️，放置棋子" : 
              isValidPlacement.reason === 1 ? "⚠️与其他棋子重叠" : 
              isValidPlacement.reason === 2 ? "⚠️超出棋盘边界" : 
              isValidPlacement.reason === 3 ? "⚠️第一步需要覆盖一个白色起始点" : 
              isValidPlacement.reason === 4 ? "⚠️不能与己方棋子的边相邻" : 
              isValidPlacement.reason === 5 ? "⚠️需要与己方棋子的角相连" : "⚠️未知错误")
            }
          </div>
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
            {isValidPlacement.valid && <button className="fab-btn confirm-btn" onClick={handleConfirm}>✔️</button>}
            {isMyTurn && <button className="fab-btn surrender-btn" onClick={handleSurrender}>🏳️</button>}
            {me && sortedPlayers[0]?.id === me.id && <button className="fab-btn restart-btn" onClick={handleRestart}>🔄</button>}
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
                  <svg width="50" height="50" viewBox="-40 -30 80 60" style={{ pointerEvents: 'none' }}>
                    {piece.shape.map((offset, idx) => {
                      const ms = 20, mh = (ms * Math.sqrt(3)) / 2;
                      const mx = offset.c * (ms / 2), my = offset.r * mh;
                      const isUp = piece.direction === 1 ? (offset.r + offset.c) % 2 === 0 : (offset.r + offset.c) % 2 !== 0;
                      const pts = isUp ? `${mx},${my} ${mx-ms/2},${my+mh} ${mx+ms/2},${my+mh}` : `${mx},${my+mh} ${mx-ms/2},${my} ${mx+ms/2},${my}`;
                      return <polygon key={idx} points={pts} fill={me?.getProfile().color.hexString || "#666"} fillOpacity={isSelected ? 1 : 0.7} stroke="#333" strokeWidth="1" />;
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
