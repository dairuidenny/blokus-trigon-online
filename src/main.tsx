import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { insertCoin } from "playroomkit";

// 初始化 Playroom 房间，完成后再进行 React 渲染
insertCoin({
  gameId: "YOUR_GAME_ID", // 暂时可以用这个占位，或者留空
  skipLobby: false,
  maxPlayersPerRoom: 2,
  defaultPlayerStates: { score: 0 },
}).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
