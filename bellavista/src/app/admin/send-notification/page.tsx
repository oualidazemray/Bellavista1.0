// src/app/admin/send-custom-notification/page.tsx
"use client";

import React, { useState, FormEvent } from "react";
import {
  Send,
  Users,
  User,
  Mail,
  Link as LinkIcon,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // shadcn Button
import { Input } from "@/components/ui/input"; // shadcn Input
import { Textarea } from "@/components/ui/textarea"; // shadcn Textarea
import { Label } from "@/components/ui/label"; // shadcn Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // shadcn Select
import { Role } from "@prisma/client"; // For role dropdown
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const AdminSendNotificationPage = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [targetType, setTargetType] = useState<
    "allClients" | "specificUser" | "specificRole"
  >("allClients");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [targetRole, setTargetRole] = useState<Role>(Role.CLIENT);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      setFormError("Title and message are required.");
      return;
    }
    if (targetType === "specificUser" && !targetUserEmail.trim()) {
      toast.error(
        "Target user email is required for specific user notifications."
      );
      setFormError("Target user email is required.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Sending notification(s)...");

    const payload: any = { title, message, link };
    if (targetType === "specificUser") {
      payload.targetUserEmail = targetUserEmail;
    } else if (targetType === "specificRole") {
      payload.targetRole = targetRole;
    }
    // If 'allClients', the backend defaults to this if no specific target is given.

    try {
      const response = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to send notification(s).");
      }
      toast.success(result.message || "Notification(s) sent successfully!", {
        id: toastId,
      });
      setFormSuccess(result.message || "Notification(s) sent successfully!");
      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      setTargetUserEmail("");
    } catch (err: any) {
      console.error("Error sending notification:", err);
      setFormError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <Mail size={30} className="text-purple-400" />
        <h1 className="text-3xl font-bold text-white">
          Send Custom Notification
        </h1>
      </div>
      <p className="text-slate-400 mb-8">
        Compose and send notifications to specific users or groups.
      </p>

      <Card className="bg-slate-800/70 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-purple-300">
            Compose Notification
          </CardTitle>
          <CardDescription className="text-slate-400">
            Target specific users, roles, or all clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-700/30 border border-green-500 text-green-200 rounded-md text-sm flex items-center gap-2">
              <CheckCircle size={18} /> {formSuccess}
            </div>
          )}
          {formError && (
            <div className="mb-4 p-3 bg-red-700/30 border border-red-500 text-red-200 rounded-md text-sm flex items-center gap-2">
              <AlertTriangle size={18} /> {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="targetType" className="text-slate-300">
                Target Audience
              </Label>
              <Select
                value={targetType}
                onValueChange={(value) => setTargetType(value as any)}
              >
                <SelectTrigger className="w-full mt-1 bg-slate-700/50 border-slate-600 text-white focus:ring-purple-500">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem
                    value="allClients"
                    className="hover:bg-slate-700 focus:bg-slate-700"
                  >
                    All Clients
                  </SelectItem>
                  <SelectItem
                    value="specificRole"
                    className="hover:bg-slate-700 focus:bg-slate-700"
                  >
                    Specific Role
                  </SelectItem>
                  <SelectItem
                    value="specificUser"
                    className="hover:bg-slate-700 focus:bg-slate-700"
                  >
                    Specific User (by Email)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === "specificUser" && (
              <div>
                <Label htmlFor="targetUserEmail" className="text-slate-300">
                  Target User Email
                </Label>
                <Input
                  type="email"
                  id="targetUserEmail"
                  value={targetUserEmail}
                  onChange={(e) => setTargetUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required={targetType === "specificUser"}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}

            {targetType === "specificRole" && (
              <div>
                <Label htmlFor="targetRoleSelect" className="text-slate-300">
                  Target Role
                </Label>
                <Select
                  value={targetRole}
                  onValueChange={(value) => setTargetRole(value as Role)}
                >
                  <SelectTrigger className="w-full mt-1 bg-slate-700/50 border-slate-600 text-white focus:ring-purple-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {Object.values(Role).map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="hover:bg-slate-700 focus:bg-slate-700"
                      >
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="title" className="text-slate-300">
                Notification Title
              </Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-slate-300">
                Message Content
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Enter your notification message here..."
                className="mt-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="link" className="text-slate-300">
                Optional Link (e.g., /client/promos/summer-sale)
              </Label>
              <div className="relative mt-1">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/path/to/page or https://example.com"
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Sending..." : "Send Notification(s)"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSendNotificationPage;
