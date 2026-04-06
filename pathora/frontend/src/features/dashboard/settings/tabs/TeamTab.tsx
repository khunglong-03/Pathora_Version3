"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { toastConfig } from "@/api/axiosInstance";
import { SectionCard } from "../components/SectionCard";
import { SectionHeader } from "../components/SectionHeader";
import { RoleBadge } from "../components/RoleBadge";
import { useTeamSettings } from "../hooks/useSettings";
import type { TeamRole } from "../types";

export function TeamTab() {
  const { t } = useTranslation();
  const { members, isLoading, isInviting, invite } = useTeamSettings();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Viewer");

  const subtitle = useMemo(() => `${members.length} members`, [members.length]);

  const handleInvite = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address", toastConfig);
      return;
    }

    const response = await invite({ email, role });

    if (!response.success) {
      toast.error(response.error ?? "Failed to invite member", toastConfig);
      return;
    }

    toast.success("Invitation sent", toastConfig);
    setEmail("");
    setRole("Viewer");
    setIsInviteOpen(false);
  };

  return (
    <>
      <SectionCard>
        <SectionHeader title={t("settings.teamMembers.title")} subtitle={subtitle} />

        {isLoading ? (
          <div className="px-8 py-8 text-sm text-stone-500">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="px-8 py-8 text-center space-y-2">
            <p className="text-sm font-medium text-stone-700">No team members yet</p>
            <p className="text-xs text-stone-500">Invite teammates to collaborate on workspace settings.</p>
            <Button
              onClick={() => setIsInviteOpen(true)}
              className="mt-2 bg-stone-900 text-white hover:bg-stone-800"
            >
              {t("settings.teamMembers.inviteMember")}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-8 py-4 hover:bg-stone-50/60 transition-colors duration-150">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-sm font-bold text-amber-600">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {member.status === "active" ? (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{member.name}</p>
                    <p className="text-xs text-stone-500">{member.email}</p>
                  </div>
                </div>
                <RoleBadge role={member.status === "pending" ? "Viewer" : member.role} />
              </div>
            ))}
          </div>
        )}

        <div className="px-8 pb-6 pt-4 border-t border-border">
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="border border-border text-stone-600 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all"
          >
            {t("settings.teamMembers.inviteMember")}
          </Button>
        </div>
      </SectionCard>

      {isInviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold text-stone-900">Invite member</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm"
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm"
              >
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => setIsInviteOpen(false)}
                className="border border-border text-stone-600 bg-white hover:bg-stone-50"
              >
                Cancel
              </Button>
              <Button
                disabled={isInviting}
                onClick={handleInvite}
                className="bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {isInviting ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default TeamTab;
