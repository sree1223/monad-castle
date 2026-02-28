import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from './GameScene';

/**
 * Game — React wrapper for the Phaser canvas.
 * Props:
 *   onAttack(castleId)  — called when player clicks a castle
 *   gameRef             — ref exposed to parent so parent can call scene methods
 */
const Game = ({ onAttack, onCastleInfo, gameRef: externalRef }) => {
  const containerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (gameInstanceRef.current) return;   // already mounted

    const config = {
      type: Phaser.AUTO,
      width: '100%',
      height: '100%',
      parent: containerRef.current,
      transparent: true,
      scene: GameScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('GameScene');
      sceneRef.current = scene;
      if (externalRef) externalRef.current = scene;
      if (onAttack) scene.onAttack = onAttack;
      if (onCastleInfo) scene.onCastleInfo = onCastleInfo;
    });

    return () => {
      game.destroy(true);
      gameInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && onAttack) sceneRef.current.onAttack = onAttack;
  }, [onAttack]);

  useEffect(() => {
    if (sceneRef.current && onCastleInfo) sceneRef.current.onCastleInfo = onCastleInfo;
  }, [onCastleInfo]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    />
  );
};

export default Game;

