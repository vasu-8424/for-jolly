"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bike, Phone, Mail, FileText, CheckCircle2, UserPlus, Pencil } from "lucide-react";
import { createDeliveryAgent, updateDeliveryAgent, DeliveryAgent } from "@/actions/delivery-agents";
import toast from "react-hot-toast";

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: DeliveryAgent | null;
  onSuccess: () => void;
}

export function AgentFormDialog({ open, onOpenChange, agent, onSuccess }: AgentFormDialogProps) {
  const isEditing = !!agent;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("bike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (agent) {
      setName(agent.name || "");
      setPhone(agent.phone || "");
      setEmail(agent.email || "");
      setVehicleType(agent.vehicle_type || "bike");
      setVehicleNumber(agent.vehicle_number || "");
      setStatus(agent.status || "active");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setVehicleType("bike");
      setVehicleNumber("");
      setStatus("active");
    }
    setFormError("");
  }, [agent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setFormError("Agent full name is required.");
      return;
    }

    if (!trimmedPhone) {
      setFormError("Contact phone number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && agent) {
        await updateDeliveryAgent(agent.id, {
          name: trimmedName,
          phone: trimmedPhone,
          email: email.trim() || null,
          vehicleType,
          vehicleNumber: vehicleNumber.trim() || null,
          status,
        });
        toast.success("Delivery agent updated successfully!");
      } else {
        await createDeliveryAgent({
          name: trimmedName,
          phone: trimmedPhone,
          email: email.trim() || undefined,
          vehicleType,
          vehicleNumber: vehicleNumber.trim() || undefined,
          status,
        });
        toast.success("New delivery agent added to roster!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred. Please try again.");
      toast.error(err.message || "Failed to save delivery agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <div className="p-2 rounded-lg bg-primary/10">
                {isEditing ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <DialogTitle className="text-xl">
                {isEditing ? "Edit Delivery Agent" : "Add Delivery Agent"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditing
                ? "Update contact info, vehicle details, or roster status for this agent."
                : "Register a new agent to your internal delivery fleet."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {formError && (
              <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="agent-name" className="text-xs font-semibold">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agent-name"
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agent-phone" className="text-xs font-semibold">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="agent-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="pl-9 bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agent-email" className="text-xs font-semibold">
                  Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="agent-email"
                    type="email"
                    placeholder="agent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-background border-border"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agent-vehicle-type" className="text-xs font-semibold">
                  Vehicle Type <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Bike className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <select
                    id="agent-vehicle-type"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="bike">Motorcycle / Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="cycle">Bicycle</option>
                    <option value="other">Other Vehicle</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agent-vehicle-number" className="text-xs font-semibold">
                  Registration / Plate <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="agent-vehicle-number"
                    placeholder="e.g. AP 05 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="pl-9 bg-background border-border uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="agent-status" className="text-xs font-semibold text-foreground cursor-pointer">
                  Active Roster Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Active agents appear in order assignment dropdowns.
                </p>
              </div>
              <Switch
                id="agent-status"
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : isEditing ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Save Changes
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Create Agent
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
