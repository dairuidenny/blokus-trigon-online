# Blokus Trigon Online

一个基于 React + TypeScript + Vite 的多人联机 Blokus 游戏演示，支持经典方形模式和自定义三角形变种模式。

## 项目简介

本项目实现了一个可联机对战的 Blokus 风格棋盘游戏，使用 PlayroomKit 进行多人状态同步。玩家在房间中共同游戏，首位玩家负责选择游戏模式并开始对局。

- 经典模式：标准 Blokus 方形棋盘，21 种棋子
- 三角模式：三角形网格变体，22 种棋子
- 初始玩家选择游戏模式，其他玩家显示等待提示
- 支持回合制放置、自动跳过、结束统计与胜利判定

## 主要特性

- PlayroomKit 多人实时同步
- 模式选择界面与首位玩家权限控制
- 三角/方形棋子渲染适配
- 回合控制、旋转翻转、放置确认
- 结束后显示玩家剩余棋子与分数

## 技术栈

- React 19
- TypeScript
- Vite
- PlayroomKit
- ESLint

## 目录结构

- `src/App.tsx` - 游戏主逻辑与界面
- `src/GameBoard.tsx` - 棋盘渲染与交互
- `src/PieceInventory.tsx` - 玩家棋子仓库
- `src/ModeSelection.tsx` - 模式选择界面
- `src/ClassicPieces.ts` - 经典模式棋子数据
- `src/App.css` - 界面样式

## 本地启动

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
```

## 说明

该项目适合作为 Blokus / 三角棋联机游戏原型展示，可继续扩展房间管理、AI 对手、移动端优化等功能。
