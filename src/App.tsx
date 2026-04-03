import { usePlayersList, useIsHost, myPlayer } from "playroomkit";
import './App.css';

function App() {
  // 获取所有在线玩家的列表
  const players = usePlayersList();
  // 判断自己是否是房主
  const isHost = useIsHost();
  // 获取当前玩家 (即我自己) 的 ID
  const me = myPlayer();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Blokus Trigon 联机测试</h1>
        
        <div className="status-panel">
          <p>当前房间人数: {players.length} / 4</p>
          <p>你的身份: {isHost ? "👑 房主 (Host)" : "玩家 (Player)"}</p>
        </div>

        <div className="player-list">
          <h3>在线玩家列表：</h3>
          <ul>
            {players.map((player) => (
              <li key={player.id} style={{ color: player.getProfile().color.hexString }}>
                <img 
                  src={player.getProfile().photo} 
                  alt="avatar" 
                  style={{ width: '30px', borderRadius: '50%', marginRight: '10px' }} 
                />
                <strong>{player.getProfile().name}</strong> 
                {player.id === me.id ? " (你)" : ""}
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <button className="start-btn" onClick={() => alert("只有房主能看到这个按钮！")}>
            开始游戏
          </button>
        )}
      </header>
    </div>
  );
}

export default App;
