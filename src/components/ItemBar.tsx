import { Bomb, Target, Palette } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { Item, ItemType } from '../../shared/types';

interface ItemBarProps {
  onUseItem?: (item: Item) => void;
}

const ITEM_ICONS: Record<ItemType, React.ReactNode> = {
  bomb: <Bomb className="w-5 h-5" />,
  range: <Target className="w-5 h-5" />,
  color_change: <Palette className="w-5 h-5" />,
};

const ITEM_NAMES: Record<ItemType, string> = {
  bomb: '炸弹',
  range: '范围',
  color_change: '换色',
};

export default function ItemBar({ onUseItem }: ItemBarProps) {
  const availableItems = useGameStore((s) => s.availableItems);
  const selectedItem = useGameStore((s) => s.selectedItem);
  const selectItem = useGameStore((s) => s.selectItem);

  if (availableItems.length === 0) {
    return null;
  }

  const handleItemClick = (item: Item) => {
    if (selectedItem?.id === item.id) {
      selectItem(null);
    } else {
      selectItem(item);
      if (onUseItem) {
        onUseItem(item);
      }
    }
  };

  return (
    <div className="flex gap-3 mt-4">
      {availableItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item)}
          className={`glass-card px-4 py-3 rounded-xl flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
            selectedItem?.id === item.id
              ? 'ring-2 ring-cyan-400 bg-cyan-400/20'
              : 'hover:bg-white/10'
          }`}
        >
          <div className="text-cyan-400">{ITEM_ICONS[item.type]}</div>
          <div className="text-[10px] text-white/70">{ITEM_NAMES[item.type]}</div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
            {item.count}
          </div>
        </button>
      ))}
    </div>
  );
}
