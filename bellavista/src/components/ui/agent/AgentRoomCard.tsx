// src/components/ui/agent/AgentRoomCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import {
  BedDouble,
  Users,
  Eye,
  DollarSign,
  CheckCircle,
  Sparkles,
  Wifi,
  Tv,
  HotelIcon,
  ThermometerSnowflake,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoomData } from "@/app/agent/new-booking/page"; // Import RoomData from the page
import { Card, CardContent } from "../card";

// Props for AgentRoomCard
interface AgentRoomCardProps extends RoomData {
  onSelectRoom: () => void;
  isSelected?: boolean;
}

const CharacteristicIcon: React.FC<{ char: string }> = ({ char }) => {
  const c = char.toLowerCase();
  if (c.includes("wifi")) return <Wifi size={14} className="text-sky-400" />;
  if (c.includes("ac") || c.includes("air conditioning"))
    return <ThermometerSnowflake size={14} className="text-blue-400" />;
  if (c.includes("tv")) return <Tv size={14} className="text-purple-400" />;
  if (c.includes("balcony"))
    return <Sparkles size={14} className="text-yellow-400" />;
  return <Info size={14} className="text-slate-400" />; // Default icon
};

const AgentRoomCard: React.FC<AgentRoomCardProps> = ({
  id,
  imageUrl,
  name,
  description,
  price,
  beds,
  bedType,
  guests,
  view,
  characteristics,
  sqMeters,
  currency = "MAD",
  onSelectRoom,
  isSelected = false,
}) => {
  return (
    <Card
      className={`flex flex-col bg-slate-800/80 border rounded-xl shadow-lg transition-all duration-300 ease-in-out group overflow-hidden
                  ${
                    isSelected
                      ? "border-green-500 ring-2 ring-green-500/70"
                      : "border-slate-700 hover:border-cyan-500/70 hover:shadow-cyan-500/10"
                  }`}
    >
      {imageUrl ? (
        <div className="relative w-full h-48 sm:h-52 overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="w-full h-48 sm:h-52 bg-slate-700 flex items-center justify-center text-slate-500 rounded-t-xl">
          <HotelIcon size={48} />
        </div>
      )}
      <CardContent className="p-4 flex flex-col flex-grow">
        <h3
          className={`text-lg font-semibold mb-1 truncate ${
            isSelected
              ? "text-green-300"
              : "text-cyan-200 group-hover:text-cyan-100"
          }`}
          title={name}
        >
          {name}
        </h3>
        {description && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2 group-hover:line-clamp-none">
            {description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-300 mb-3">
          <div className="flex items-center gap-1.5 truncate" title={bedType}>
            <BedDouble size={14} className="text-slate-500 shrink-0" />{" "}
            <span>
              {bedType} {beds ? `(${beds})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-500 shrink-0" /> Up to{" "}
            {guests} guests
          </div>
          {view && (
            <div className="flex items-center gap-1.5 truncate" title={view}>
              <Eye size={14} className="text-slate-500 shrink-0" /> {view} View
            </div>
          )}
          {sqMeters && (
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-slate-500 shrink-0" />{" "}
              {sqMeters} m²
            </div>
          )}
        </div>

        {characteristics && characteristics.length > 0 && (
          <div className="mb-3">
            {/* <p className="text-xs font-medium text-slate-400 mb-1">Amenities:</p> */}
            <div className="flex flex-wrap gap-1.5 max-h-12 overflow-hidden group-hover:max-h-none">
              {characteristics.map((char) => (
                <Badge
                  key={char}
                  variant="secondary"
                  className="text-xs bg-slate-700 border-slate-600 text-slate-300 px-1.5 py-0.5 whitespace-nowrap"
                >
                  <CharacteristicIcon char={char} />{" "}
                  <span className="ml-1">{char}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-slate-700/50 flex items-end justify-between">
          <div>
            <p className="text-xs text-amber-400">Per night</p>
            <p className="text-xl font-bold text-white">
              {price.toFixed(2)}{" "}
              <span className="text-sm font-normal">{currency}</span>
            </p>
          </div>
          <Button
            onClick={onSelectRoom}
            size="sm"
            className={`${
              isSelected
                ? "bg-green-600 hover:bg-green-700 cursor-default"
                : "bg-cyan-600 hover:bg-cyan-700"
            } text-white shadow-md`}
            disabled={isSelected}
          >
            {isSelected ? (
              <>
                <CheckCircle size={16} className="mr-1.5" />
                Selected
              </>
            ) : (
              "Select Room"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentRoomCard;
