"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface DeliveryLocationCardProps {
  order: any;
}

export function DeliveryLocationCard({ order }: DeliveryLocationCardProps) {
  const [copied, setCopied] = useState(false);

  // Extract address and coordinates from order snapshot or details
  const rawAddress =
    order?.delivery_address_text ||
    order?.delivery_address ||
    order?.delivery_address_details?.full_address ||
    "No delivery address provided.";

  const landmark =
    order?.delivery_landmark ||
    order?.delivery_address_details?.landmark ||
    "";

  const rawLat =
    order?.delivery_latitude ??
    order?.delivery_address_details?.latitude;

  const rawLng =
    order?.delivery_longitude ??
    order?.delivery_address_details?.longitude;

  const numLat = rawLat != null && rawLat !== "" ? Number(rawLat) : null;
  const numLng = rawLng != null && rawLng !== "" ? Number(rawLng) : null;

  const hasValidCoordinates =
    numLat !== null &&
    numLng !== null &&
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    numLat !== 0 &&
    numLng !== 0 &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180;

  const drivingNavUrl = hasValidCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}&travelmode=driving`
    : null;

  const pinSearchUrl = hasValidCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${numLat},${numLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        rawAddress.toLowerCase().includes("kakinada")
          ? rawAddress
          : `${rawAddress}, Kakinada, Andhra Pradesh`
      )}`;

  const accuracy =
    order?.delivery_location_accuracy ??
    order?.delivery_address_details?.accuracy;

  const handleCopyCoordinates = () => {
    if (!hasValidCoordinates) return;
    const coordString = `${numLat}, ${numLng}`;
    navigator.clipboard.writeText(coordString);
    setCopied(true);
    toast.success("Coordinates copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Delivery Location
          </CardTitle>
          {hasValidCoordinates ? (
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              GPS Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] font-medium text-amber-600 border-amber-500/30 bg-amber-500/10">
              Approximate
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Full Address */}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {rawAddress}
          </p>
          {landmark && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-foreground/80">Landmark:</span>
              {landmark}
            </p>
          )}
        </div>

        {/* Coordinates Row & Copy */}
        {hasValidCoordinates ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Exact Coordinates
              </span>
              <span className="font-mono font-medium text-foreground">
                {numLat.toFixed(6)}, {numLng.toFixed(6)}
              </span>
              {accuracy != null && Number(accuracy) > 0 && (
                <span className="text-[10px] text-muted-foreground block">
                  Accuracy: ~{Number(accuracy).toFixed(0)}m
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCoordinates}
              className="h-8 px-2.5 text-xs gap-1 hover:bg-background"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">No exact pin available</span>
              <span>This order has no GPS coordinates recorded. Navigation will search by address text.</span>
            </div>
          </div>
        )}

        {/* Embedded Map Preview (Client-side OpenStreetMap) */}
        {hasValidCoordinates && (
          <div className="relative rounded-lg overflow-hidden border bg-muted aspect-[16/9] max-h-48 w-full">
            <iframe
              title="Customer Location Map Preview"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${numLng - 0.005}%2C${numLat - 0.003}%2C${numLng + 0.005}%2C${numLat + 0.003}&layer=mapnik&marker=${numLat}%2C${numLng}`}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {drivingNavUrl ? (
            <Button
              variant="default"
              size="sm"
              asChild
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
            >
              <a href={drivingNavUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4" /> Navigate (Google Maps)
              </a>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              asChild
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
            >
              <a href={pinSearchUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4" /> Navigate to Address
              </a>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full gap-2 border-border hover:bg-muted"
          >
            <a href={pinSearchUrl} target="_blank" rel="noopener noreferrer">
              <Compass className="w-4 h-4 text-primary" /> Open in Maps
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

