import { usePlayersList, useMultiplayerState, myPlayer } from "playroomkit";
import { useState, useMemo, useEffect } from "react";
import './App.css';
import ModeSelection from './ModeSelection';
import GameBoard from './GameBoard';
import PieceInventory from './PieceInventory';
import { CLASSIC_PIECES } from './ClassicPieces';

// --- 类型定义 ---
type BoardState = Record<string, string>;
type UsedPiecesState = Record<string, string[]>;

// --- 1. 核心数学：三角形网格判定 ---
const getTileDir = (r: number, c: number) => (r + c) % 2 === 0 ? 1 : -1;

const TRI_SIZE = 32; 
const H = (TRI_SIZE * Math.sqrt(3)) / 2; 

// --- 2. 22 个真实棋子数据 ---
export const REAL_PIECES = [
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
  const humanPlayers = useMemo(() => [...players].sort((a, b) => a.id.localeCompare(b.id)), [players]);
  
  // Fixed team colors for all players (both human and AI)
  const TEAM_COLORS = ["#d64545", "#4b7bec", "#20bf6b", "#f39c12"];
  
  // Function to get consistent team color for any player based on their ID
  const getTeamColor = (playerId: string) => {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
  };
  
  const aiPlayers = useMemo(() => {
    const needed = Math.max(0, 4 - humanPlayers.length);
    return Array.from({ length: needed }, (_, idx) => {
      const aiId = `ai-${idx + 1}`;
      const teamColor = getTeamColor(aiId);
      
      // Generate random background color for AI avatar (different from team color)
      const randomColor = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
      const rgbToHex = (rgb: string) => {
        const match = rgb.match(/\d+/g);
        if (!match) return "#808080";
        const [r, g, b] = match.map(Number);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
      };
      const avatarBgColor = rgbToHex(randomColor);
      
      // Create SVG with random background and robot emoji
      const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><defs><linearGradient id='grad${idx}' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:${avatarBgColor};stop-opacity:1' /><stop offset='100%' style='stop-color:${avatarBgColor}cc;stop-opacity:1' /></linearGradient></defs><rect width='40' height='40' fill='url(#grad${idx})'/><text x='50%' y='50%' font-size='24' text-anchor='middle' dominant-baseline='central'>🤖</text></svg>`;
      const photoUrl = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;
      
      return {
        id: aiId,
        getProfile: () => ({
          name: `AI ${idx + 1}`,
          photo: photoUrl,
          color: { hexString: teamColor }, // Team color for border and pieces
        }),
      };
    });
  }, [humanPlayers.length]);
  
  // Override human players' colors to use consistent team colors
  const allPlayers = useMemo(() => {
    const playersWithColors = humanPlayers.map(p => ({
      ...p,
      getProfile: () => ({
        ...p.getProfile(),
        color: { hexString: getTeamColor(p.id) },
      }),
    }));
    return [...playersWithColors, ...aiPlayers];
  }, [humanPlayers, aiPlayers]);
  const me = myPlayer();

  // --- 3. 联机状态 ---
  const [board, setBoard] = useMultiplayerState<BoardState>("board", {});
  const [turnIndex, setTurnIndex] = useMultiplayerState("turnIndex", 0);
  const [usedPieces, setUsedPieces] = useMultiplayerState<UsedPiecesState>("usedPieces", {}); // { playerId: [pieceIds] }
  const [skippedPlayers, setSkippedPlayers] = useMultiplayerState<Record<string, boolean>>("skippedPlayers", {}); // 跳过玩家
  const [pendingPlacement, setPendingPlacement] = useMultiplayerState<Record<string, boolean>>("pendingPlacement", {}); // { playerId: true }
  const [gameEnded, setGameEnded] = useMultiplayerState("gameEnded", false);
  const [gameMode, setGameMode] = useMultiplayerState<"trigon" | "classic">("gameMode", "trigon");

  const [showModeSelection, setShowModeSelection] = useState(false);

  const currentPlayer = allPlayers[turnIndex % allPlayers.length];
  const isMyTurn = currentPlayer?.id === me?.id && !gameEnded;
  const isAiTurn = currentPlayer?.id.startsWith("ai-") && !gameEnded && !skippedPlayers[currentPlayer.id];

  // 初始化模式选择
  useEffect(() => {
    if (humanPlayers.length > 0 && humanPlayers[0].id === me?.id && turnIndex === 0 && Object.keys(usedPieces).length === 0) {
      setShowModeSelection(true);
    }
  }, [humanPlayers, me, turnIndex, usedPieces]);

  const handleSelectMode = (mode: "trigon" | "classic") => {
    setGameMode(mode);
    setShowModeSelection(false);
    // 确保游戏从第一回合开始
    if (turnIndex === 0) {
      setTurnIndex(0);
    }
  };

  // 自动跳过被跳过的玩家或已用完棋子的玩家
  useEffect(() => {
    if (gameEnded) return;
    
    const currentIndex = turnIndex % allPlayers.length;
    const currentPlayer = allPlayers[currentIndex];
    if (!currentPlayer) return;
    
    const usedCount = (usedPieces[currentPlayer.id] || []).length;
    const isSkipped = skippedPlayers[currentPlayer.id];
    const isPlacing = pendingPlacement[currentPlayer.id];
    const totalPieces = gameMode === "classic" ? 21 : 22;
    const isFinished = usedCount === totalPieces;
    
    // 如果当前玩家正在进行未确认的放置，则不要自动跳过
    if (isPlacing) return;

    // 如果当前玩家已用完所有棋子但还没标记为跳过，自动标记为跳过
    if (isFinished && !isSkipped) {
      const newSkipped = { ...skippedPlayers, [currentPlayer.id]: true };
      setSkippedPlayers(newSkipped);
      // 检查是否所有玩家都被跳过
      if (allPlayers.every(p => newSkipped[p.id])) {
        setGameEnded(true);
      }
    }
    // 如果当前玩家被跳过，自动跳过到下一个玩家
    else if (isSkipped) {
      setTurnIndex(turnIndex + 1);
    }
  }, [turnIndex, allPlayers, skippedPlayers, usedPieces, gameEnded]);

  // 回合开始时重置旋转和翻转状态
  useEffect(() => {
    if (isMyTurn) {
      setRotation(0);
      setFlipV(1);
      setFlipH(1);
    }
  }, [isMyTurn]);

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); 
  const [flipV, setFlipV] = useState(1); 
  const [flipH, setFlipH] = useState(1); 
  const [ghostPos, setGhostPos] = useState<{ r: number, c: number } | null>(null);

  const getDefaultGhostPos = () => {
    return gameMode === "classic" ? { r: 9, c: 9 } : { r: 8, c: 17 };
  };

  const getTransformedDataFor = (
    pieceId: string | null,
    rotationValue: number,
    flipVValue: number,
    flipHValue: number
  ) => {
    if (gameMode === "classic") {
      const original = CLASSIC_PIECES.find(p => `p-${p.id}` === pieceId);
      if (!original) return { shape: [], activeDirection: 1 };
      let newShape = original.shape.map(coord => ({ r: coord.r * flipVValue, c: coord.c * flipHValue }));
      // 经典模式旋转逻辑（顺时针）
      for (let i = 0; i < rotationValue; i++) {
        newShape = newShape.map(pos => ({ r: -pos.c, c: pos.r }));
      }
      return { shape: newShape, activeDirection: 1 };
    } else {
      const original = REAL_PIECES.find(p => `p-${p.id}` === pieceId);
      if (!original) return { shape: [], activeDirection: 1 };
      let newShape = original.shape.map(coord => ({ r: coord.r * flipVValue, c: coord.c * flipHValue }));
      const activeDirection = original.direction * flipVValue * (rotationValue % 2 === 0 ? 1 : -1);
      const cx_offset = H / 3 * ((original.direction * flipVValue === 1) ? -1 : 1);
      newShape = newShape.map(pos => {
        const cx = pos.r * H + ((pos.r + pos.c) % 2 === 0 ? 0 : cx_offset);
        const cy = pos.c * 0.5 * TRI_SIZE;
        const cx_new = cx * Math.cos(Math.PI / 3 * rotationValue) - cy * Math.sin(Math.PI / 3 * rotationValue);
        const cy_new = cx * Math.sin(Math.PI / 3 * rotationValue) + cy * Math.cos(Math.PI / 3 * rotationValue);
        return { r: Math.floor(cx_new / H + 0.5), c: Math.floor(cy_new / (0.5 * TRI_SIZE) + 0.5) };
      });
      return { shape: newShape, activeDirection };
    }
  };

  const performSnapForPiece = (
    r: number,
    c: number,
    pieceId: string,
    rotationValue: number,
    flipVValue: number
  ) => {
    if (gameMode === "classic") {
      return { r, c };
    }

    const original = REAL_PIECES.find(p => `p-${p.id}` === pieceId);
    if (!original) {
      return { r, c };
    }

    const activeDirection = original.direction * flipVValue * (rotationValue % 2 === 0 ? 1 : -1);
    if (getTileDir(r, c) !== activeDirection) {
      const { sides } = getNeighbors(r, c);
      const [nr, nc] = sides[0].split("-").map(Number);
      return { r: nr, c: nc };
    }
    return { r, c };
  };

  const handleSelectPiece = (pieceId: string) => {
    setSelectedPieceId(pieceId);
    setRotation(0);
    setFlipV(1);
    setFlipH(1);
    setGhostPos(prev => {
      const target = prev || getDefaultGhostPos();
      return performSnapForPiece(target.r, target.c, pieceId, 0, 1);
    });
    if (me) {
      setPendingPlacement({ ...pendingPlacement, [me.id]: true });
    }
  };

  const getAiAvailablePieces = (playerId: string) => {
    const used = usedPieces[playerId] || [];
    const allIds = gameMode === "classic"
      ? CLASSIC_PIECES.map(p => `p-${p.id}`)
      : REAL_PIECES.map(p => `p-${p.id}`);
    return allIds.filter(id => !used.includes(id.replace("p-", "")));
  };

  const evaluatePlacement = (
    transformed: { shape: { r: number; c: number }[]; activeDirection: number },
    r: number,
    c: number,
    myColor: string,
    isFirstMove: boolean
  ) => {
    let invalidCondition = 0;
    let hasCorner = false;
    let coversStart = false;
    let cornerCount = 0;

    if (gameMode === "classic") {
      for (const offset of transformed.shape) {
        const rr = r + offset.r;
        const cc = c + offset.c;
        const key = `${rr}-${cc}`;
        if (board[key]) {
          invalidCondition = 1;
          break;
        }
        if (rr < 0 || rr >= 20 || cc < 0 || cc >= 20) {
          invalidCondition = 2;
          break;
        }
        if (isFirstMove) {
          const startPoints = [{ r: 0, c: 0 }, { r: 0, c: 19 }, { r: 19, c: 0 }, { r: 19, c: 19 }];
          if (startPoints.some(p => p.r === rr && p.c === cc)) coversStart = true;
        }
        const neighbors = [
          { r: rr - 1, c: cc }, { r: rr + 1, c: cc }, { r: rr, c: cc - 1 }, { r: rr, c: cc + 1 },
          { r: rr - 1, c: cc - 1 }, { r: rr - 1, c: cc + 1 }, { r: rr + 1, c: cc - 1 }, { r: rr + 1, c: cc + 1 },
        ];
        for (const n of neighbors) {
          const nKey = `${n.r}-${n.c}`;
          if (board[nKey] === myColor) {
            const isEdge = (n.r === rr && Math.abs(n.c - cc) === 1) || (n.c === cc && Math.abs(n.r - rr) === 1);
            if (isEdge) {
              invalidCondition = 4;
              break;
            } else {
              hasCorner = true;
              cornerCount += 1;
            }
          }
        }
        if (invalidCondition > 0) break;
      }
    } else {
      for (const offset of transformed.shape) {
        const rr = r + offset.r;
        const cc = c + offset.c;
        const key = `${rr}-${cc}`;
        if (board[key]) {
          invalidCondition = 1;
          break;
        }
        if (rr < 0 || rr > 17 || cc < (rr < 9 ? 8 - rr : rr - 9) || cc > (rr < 9 ? rr + 26 : 43 - rr)) {
          invalidCondition = 2;
          break;
        }
        if (isFirstMove) {
          const startPoints = [{ r: 3, c: 17 }, { r: 6, c: 9 }, { r: 6, c: 25 }, { r: 11, c: 9 }, { r: 11, c: 25 }, { r: 14, c: 17 }];
          if (startPoints.some(p => p.r === rr && p.c === cc)) coversStart = true;
        }
        const { sides, corners } = getNeighbors(rr, cc);
        for (const s of sides) {
          if (board[s] === myColor) {
            invalidCondition = 4;
            break;
          }
        }
        if (invalidCondition > 0) break;
        for (const cor of corners) {
          if (board[cor] === myColor) {
            hasCorner = true;
            cornerCount += 1;
          }
        }
      }
    }

    if (invalidCondition === 0) {
      if (isFirstMove && !coversStart) invalidCondition = 3;
      else if (!isFirstMove && !hasCorner) invalidCondition = 5;
    }

    if (invalidCondition !== 0) return null;

    return 1000 + transformed.shape.length * 10 + cornerCount * 5 + (coversStart ? 200 : 0);
  };

  const chooseBestAiMove = (aiId: string) => {
    const availablePieces = getAiAvailablePieces(aiId);
    if (availablePieces.length === 0) return null;

    const myColor = allPlayers.find(p => p.id === aiId)?.getProfile().color.hexString || "#888";
    const isFirstMove = !Object.values(board).includes(myColor || "");
    let bestMove: any = null;
    let bestScore = -Infinity;

    const rowCount = gameMode === "classic" ? 20 : 18;

    for (const pieceId of availablePieces) {
      const flipOptions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      const rotateCount = gameMode === "classic" ? 4 : 6;

      for (const [flipVOption, flipHOption] of flipOptions) {
        for (let rotationOption = 0; rotationOption < rotateCount; rotationOption++) {
          const transformed = getTransformedDataFor(pieceId, rotationOption, flipVOption, flipHOption);

          for (let r = 0; r < rowCount; r++) {
            const minCol = gameMode === "classic" ? 0 : (r < 9 ? 8 - r : r - 9);
            const maxCol = gameMode === "classic" ? 19 : (r < 9 ? r + 26 : 43 - r);
            for (let c = minCol; c <= maxCol; c++) {
              const snapped = performSnapForPiece(r, c, pieceId, rotationOption, flipVOption);
              if (snapped.r !== r || snapped.c !== c) continue;

              const score = evaluatePlacement(transformed, r, c, myColor || "", isFirstMove);
              if (score !== null && score > bestScore) {
                bestScore = score;
                bestMove = { pieceId, r, c, rotationOption, flipVOption, flipHOption, transformed };
              }
            }
          }
        }
      }
    }

    return bestMove;
  };

  const runAiTurn = (aiId: string) => {
    const aiPlayer = allPlayers.find(p => p.id === aiId);
    if (!aiPlayer) return;
    const bestMove = chooseBestAiMove(aiId);
    if (!bestMove) {
      const newSkipped = { ...skippedPlayers, [aiId]: true };
      setSkippedPlayers(newSkipped);
      setTurnIndex(turnIndex + 1);
      return;
    }

    const myColor = aiPlayer.getProfile().color.hexString;
    const newBoard = { ...board };
    bestMove.transformed.shape.forEach((o: any) => {
      newBoard[`${bestMove.r + o.r}-${bestMove.c + o.c}`] = myColor;
    });
    const myUsed = usedPieces[aiId] || [];
    const pieceKey = bestMove.pieceId.replace("p-", "");
    const newUsed = { ...usedPieces, [aiId]: [...myUsed, pieceKey] };

    setBoard(newBoard);
    setUsedPieces(newUsed);
    setTurnIndex(turnIndex + 1);
  };

  useEffect(() => {
    if (!isAiTurn || !currentPlayer) return;
    const aiId = currentPlayer.id;
    const timeout = window.setTimeout(() => runAiTurn(aiId), 600);
    return () => window.clearTimeout(timeout);
  }, [isAiTurn, currentPlayer, board, usedPieces, skippedPlayers, gameMode]);

  const transformedData = useMemo(() => getTransformedDataFor(selectedPieceId, rotation, flipV, flipH), [selectedPieceId, rotation, flipV, flipH, gameMode]);

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
    // 经典模式不需要吸附，直接返回点击位置
    if (gameMode === "classic") {
      return { r, c };
    }
    
    // 三角模式需要考虑方向吸附
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

    if (gameMode === "classic") {
      // 经典模式验证逻辑
      for (const offset of transformedData.shape) {
        const r = ghostPos.r + offset.r, c = ghostPos.c + offset.c, key = `${r}-${c}`;
        if (board[key]) {
          invalidCondition = 1; // 与已有棋子重叠
          break;
        }
        // 检查20x20网格边界
        if (r < 0 || r >= 20 || c < 0 || c >= 20) {
          invalidCondition = 2; // 超出棋盘边界
          break;
        }
        if (isFirstMove) {
          // 经典模式起始点：四个角落
          const startPoints = [{r:0,c:0}, {r:0,c:19}, {r:19,c:0}, {r:19,c:19}];
          if (startPoints.some(p => p.r === r && p.c === c)) {
            coversStart = true;
          }
        }
        // 经典模式：不能与己方棋子边相邻，只能与角相邻
        const neighbors = [
          {r: r-1, c: c}, {r: r+1, c: c}, {r: r, c: c-1}, {r: r, c: c+1}, // 边
          {r: r-1, c: c-1}, {r: r-1, c: c+1}, {r: r+1, c: c-1}, {r: r+1, c: c+1} // 角
        ];
        for (const n of neighbors) {
          const nKey = `${n.r}-${n.c}`;
          if (board[nKey] === myColor) {
            const isEdge = (n.r === r && Math.abs(n.c - c) === 1) || (n.c === c && Math.abs(n.r - r) === 1);
            if (isEdge) {
              invalidCondition = 4; // 与己方棋子边相邻
              break;
            } else {
              hasCorner = true;
            }
          }
        }
        if (invalidCondition > 0) break;
      }
    } else {
      // 三角模式验证逻辑
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
  }, [isMyTurn, selectedPieceId, ghostPos, transformedData, board, me, gameMode]);

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
    setPendingPlacement({ ...pendingPlacement, [me.id]: false });
    setTurnIndex(turnIndex + 1);
    setGhostPos(null); 
    setSelectedPieceId(null);
  };

  const handleRestart = () => {
    // 只有房主（第一个玩家）可以重新开始戏戏
    if (!me || humanPlayers[0]?.id !== me.id) return;
    
    const confirmed = window.confirm("确定要重新开始游戏吗？所有进度将被重置。");
    if (confirmed) {
      // 重置所有游戏状态
      setBoard({});
      setTurnIndex(0);
      setUsedPieces({});
      setSkippedPlayers({});
      setPendingPlacement({});
      setGameEnded(false);
      setGameMode("trigon"); // 重置为默认模式
      
      // 重置本地状态
      setSelectedPieceId(null);
      setRotation(0);
      setFlipV(1);
      setFlipH(1);
      setGhostPos(null);
      
      // 显示模式选择界面
      setShowModeSelection(true);
    }
  };

  const handleSurrender = () => {
    if (!me || !isMyTurn) return;
    const confirmed = window.confirm("确定要放弃本回合吗？之后轮到您时将自动跳过。");
    if (confirmed) {
      const newSkipped = { ...skippedPlayers, [me.id]: true };
      setSkippedPlayers(newSkipped);
      setPendingPlacement({ ...pendingPlacement, [me.id]: false });
      setTurnIndex(turnIndex + 1);
      setSelectedPieceId(null);
      setGhostPos(null);
    }
  };
  const gameStatus = useMemo(() => {
    if (gameEnded) return { ended: true };
    
    const allPlayersSkipped = allPlayers.every(p => skippedPlayers[p.id]);
    
    if (allPlayersSkipped) {
      setGameEnded(true);
      return { ended: true };
    }
    
    return { ended: false };
  }, [allPlayers, skippedPlayers, gameEnded]);

  // 计算得分
  const scores = useMemo(() => {
    if (!gameStatus.ended) return {};
    
    const result: Record<string, { score: number, pieces: number }> = {};
    const totalPieces = gameMode === "classic" ? 21 : 22;
    const piecesData = gameMode === "classic" ? CLASSIC_PIECES : REAL_PIECES;
    
    allPlayers.forEach(p => {
      const usedCount = (usedPieces[p.id] || []).length;
      const remainingPieces = totalPieces - usedCount;
      let score = 0;
      
      if (remainingPieces === 0) {
        score = 15; // 全部下完得15分
      } else {
        // 计算剩余棋子的总格子数
        const remainingPieceIds = piecesData.filter(piece => !usedPieces[p.id]?.includes(piece.id));
        const totalCells = remainingPieceIds.reduce((sum, piece) => sum + piece.shape.length, 0);
        score = -totalCells; // 每个格子减一分
      }
      
      result[p.id] = { score, pieces: remainingPieces };
    });
    
    return result;
  }, [gameStatus.ended, allPlayers, usedPieces, gameMode]);

  const winner = useMemo((): typeof allPlayers[0][] => {
    if (!gameStatus.ended) return [];
    let maxScore = -Infinity;
    let winners: typeof allPlayers[0][] = [];
    allPlayers.forEach(p => {
      const score = scores[p.id]?.score || 0;
      if (score > maxScore) {
        maxScore = score;
        winners = [p];
      } else if (score === maxScore) {
        winners.push(p);
      }
    });
    return winners;
  }, [gameStatus.ended, scores, allPlayers]);

  return (
    <div className="iphone-screen">
      {showModeSelection ? (
        <ModeSelection onSelectMode={handleSelectMode} />
      ) : (
        <div className="iphone-container">
          {me && humanPlayers[0]?.id === me.id && (
            <button className="restart-btn-top" onClick={handleRestart}>🔄</button>
          )}

          <div className="header-section">
            <div className="avatar-row">
              {allPlayers.map((p, i) => (
                <div key={p.id} className={`avatar-item ${turnIndex % allPlayers.length === i && !gameEnded ? 'active' : ''}`}>
                  <div className="avatar-frame" style={{borderColor: p.getProfile().color.hexString}}>
                    <img src={p.getProfile().photo} alt="p" />
                  </div>
                  {!gameEnded && skippedPlayers[p.id] && (
                    <div className="surrender-flag">🏳️</div>
                  )}
                  <span className="player-name">{p.getProfile().name.slice(0,5)}</span>
                  {gameEnded && scores[p.id] && (
                    <div className="score-display">
                      <div>剩余: {scores[p.id].pieces}块</div>
                      <div>得分: {scores[p.id].score}</div>
                      {winner.some(w => w.id === p.id) && <div className="winner-crown">👑</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="status-banner">
              {gameEnded ? 
                `游戏结束！${winner.length > 0 ? winner.map(w => w.getProfile().name).join('、') : '未知玩家'} 获胜！` :
                (!isMyTurn ? `${currentPlayer?.getProfile().name} 思考中...` : 
                !selectedPieceId ? "选择一枚棋子，在棋盘上拖动放置" : 
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
            <GameBoard
              mode={gameMode}
              board={board}
              ghostPos={ghostPos}
              transformedData={transformedData}
              isMyTurn={isMyTurn}
              selectedPieceId={selectedPieceId}
              onTileClick={(r, c) => setGhostPos(performSnap(r, c))}
              onTileDrag={(r, c) => setGhostPos(performSnap(r, c))}
            />
          </div>

          <div className={`controls-row ${!isMyTurn ? 'controls-placeholder' : ''}`}>
            {isMyTurn && (
              <>
                <button className="control-button" onClick={handleSurrender}>🏳️</button>
                <button className="control-button" onClick={() => setFlipV(v => -v)}>↕️</button>
                <button className="control-button" onClick={() => setFlipH(h => -h)}>↔️</button>
                <button className="control-button" onClick={() => setRotation(r => (r + 1) % (gameMode === "classic" ? 4 : 6))}>↪️</button>
                <button className="control-button" onClick={() => setRotation(r => (r + (gameMode === "classic" ? 3 : 5)) % (gameMode === "classic" ? 4 : 6))}>↩️</button>
                {isValidPlacement.valid ? (
                  <button className="control-button" onClick={handleConfirm}>✅️</button>
                ) : (
                  <div className="control-button-placeholder"></div>
                )}
              </>
            )}
          </div>

          <div className="inventory-section">
            <PieceInventory
              mode={gameMode}
              usedPieces={usedPieces}
              selectedPieceId={selectedPieceId}
              isMyTurn={isMyTurn}
              onSelectPiece={handleSelectPiece}
            />
          </div>

          <div className="footer-scroll">
            <div className="scroll-indicator"></div>
            <p className="section-title">其他玩家剩余情况</p>
            {allPlayers.filter(p => p.id !== me?.id).map(p => {
              const playerColor = p.getProfile().color.hexString;
              const usedIds = usedPieces[p.id] || [];
              const piecesData = gameMode === "classic" ? CLASSIC_PIECES : REAL_PIECES;
              return (
                <div key={p.id} className="other-player-section">
                  <div className="other-player-header" style={{color: playerColor}}>{p.getProfile().name}</div>
                  <div className="other-player-piece-grid">
                    {piecesData.map(piece => {
                      const isUsed = usedIds.includes(piece.id);
                      if (isUsed) return <div key={piece.id} className="piece-card other-empty"></div>;
                      
                      return (
                        <div key={piece.id} className="piece-card other-piece">
                          <svg width="50" height="50" viewBox="-40 -30 80 60" style={{ pointerEvents: 'none' }}>
                            {piece.shape.map((offset, idx) => {
                              if (gameMode === "classic") {
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
                                    fill={playerColor}
                                    fillOpacity={0.7}
                                    stroke="#333"
                                    strokeWidth="1"
                                  />
                                );
                              } else {
                                // 三角形渲染逻辑（放大 1.1 倍）
                                const scale = 1.1;
                                const ms = 20 * scale, mh = (ms * Math.sqrt(3)) / 2;
                                const mx = offset.c * (ms / 2), my = offset.r * mh;
                                const isUp = (piece as any).direction === 1 ? (offset.r + offset.c) % 2 === 0 : (offset.r + offset.c) % 2 !== 0;
                                const pts = isUp ? `${mx},${my} ${mx-ms/2},${my+mh} ${mx+ms/2},${my+mh}` : `${mx},${my+mh} ${mx-ms/2},${my} ${mx+ms/2},${my}`;
                                return <polygon key={idx} points={pts} fill={playerColor} fillOpacity={0.7} stroke="#333" strokeWidth="1" />;
                              }
                            })}
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
