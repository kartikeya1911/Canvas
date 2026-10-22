import React from 'react';
import { Group, Circle, Text } from 'react-konva';

const CursorManager = ({ cursors = new Map() }) => {
  const cursorArray = Array.from(cursors.entries());

  return (
    <>
      {cursorArray.map(([userId, cursor]) => (
        <Group key={userId} x={cursor.x} y={cursor.y}>
          <Circle
            radius={6}
            fill={cursor.color || '#3b82f6'}
            stroke="#ffffff"
            strokeWidth={2}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.3}
          />
          <Text
            x={10}
            y={-6}
            text={cursor.userName || 'User'}
            fontSize={11}
            fontFamily="Inter, sans-serif"
            fontStyle="bold"
            fill="#ffffff"
            padding={4}
            background="#1e293b"
            cornerRadius={4}
          />
        </Group>
      ))}
    </>
  );
};

export default CursorManager;
