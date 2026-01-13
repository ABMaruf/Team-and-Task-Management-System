import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Shield,
  Crown,
  UserPlus,
  Users,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import * as teamService from '../services/teamService';

const inviteDefaults = { name: '', email: '', role: 'member' };
const settingsDefaults = {
  streakGoal: 5,
  resetGracePeriod: 1,
  productivityWeights: {
    high: 3,
    medium: 2,
    low: 1
  },
  allowManualAdjustments: true
};

const TeamManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteForm, setInviteForm] = useState(inviteDefaults);
  const [savingInvite, setSavingInvite] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsForm, setStatsForm] = useState({ current_streak: '0', longest_streak: '0', productivity_score: '0' });
  const [statsTarget, setStatsTarget] = useState(null);
  const [savingStats, setSavingStats] = useState(false);
  const { darkMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    loadMembers();
    loadSettings();
  }, []);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await teamService.getTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members', error);
      toast.error('Unable to load team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const openStatsModal = (member) => {
    setStatsTarget(member);
    setStatsForm({
      current_streak: String(member.current_streak ?? 0),
      longest_streak: String(member.longest_streak ?? member.current_streak ?? 0),
      productivity_score: String(member.productivity_score ?? 0)
    });
    setStatsModalOpen(true);
  };

  const closeStatsModal = () => {
    setStatsTarget(null);
    setStatsModalOpen(false);
  };

  const handleStatsChange = (event) => {
    const { name, value } = event.target;
    setStatsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatsSubmit = async (event) => {
    event.preventDefault();
    if (!statsTarget) return;
    try {
      setSavingStats(true);
      const payload = {
        current_streak: Number(statsForm.current_streak),
        longest_streak: Number(statsForm.longest_streak),
        productivity_score: Number(statsForm.productivity_score)
      };
      const updated = await teamService.adjustMemberStats(statsTarget.id, payload);
      setMembers((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
      toast.success('Member stats updated');
      closeStatsModal();
    } catch (error) {
      console.error('Failed to update stats', error);
      toast.error('Could not adjust member stats');
    } finally {
      setSavingStats(false);
    }
  };

  const loadSettings = async () => {
    try {
      const teamSettings = await teamService.getTeamSettings();
      setSettings(teamSettings || settingsDefaults);
    } catch (error) {
      console.error('Failed to load settings', error);
      setSettings(settingsDefaults);
      toast.error('Unable to load settings, showing defaults.');
    }
  };

  const handleInviteChange = (event) => {
    const { name, value } = event.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.warn('Name and email are required');
      return;
    }
    try {
      setSavingInvite(true);
      const newMember = await teamService.inviteMember(inviteForm);
      setMembers((prev) => [...prev, newMember]);
      setInviteForm(inviteDefaults);
      toast.success('Invitation sent');
    } catch (error) {
      console.error('Failed to invite member', error);
      toast.error('Could not invite member');
    } finally {
      setSavingInvite(false);
    }
  };

  const handleRoleChange = async (memberId, nextRole) => {
    try {
      const updated = await teamService.updateUserRole(memberId, nextRole);
      setMembers((prev) => prev.map((member) => (member.id === memberId ? updated : member)));
      toast.success('Role updated');
    } catch (error) {
      console.error('Failed to update role', error);
      toast.error('Could not update role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === user?.id) {
      toast.warn('You cannot remove yourself');
      return;
    }
    try {
      await teamService.removeTeamMember(memberId);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.info('Member removed');
    } catch (error) {
      console.error('Failed to remove member', error);
      toast.error('Could not remove member');
    }
  };

  const handleSettingsChange = (event, path) => {
    const { value } = event.target;
    setSettings((prev) => {
      if (path.startsWith('productivityWeights.')) {
        const key = path.split('.')[1];
        return {
          ...prev,
          productivityWeights: {
            ...prev.productivityWeights,
            [key]: Number(value)
          }
        };
      }
      return {
        ...prev,
        [path]: path.includes('allow') ? event.target.checked : Number(value)
      };
    });
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    try {
      setSavingSettings(true);
      const updated = await teamService.updateTeamSettings(settings);
      setSettings(updated);
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save settings', error);
      toast.error('Could not save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const memberStats = useMemo(() => {
    const admins = members.filter((member) => member.role === 'admin').length;
    return {
      total: members.length,
      admins,
      members: members.length - admins
    };
  }, [members]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`pt-20 pb-16 transition-all duration-300 ${
          sidebarOpen ? 'md:pl-72' : 'md:pl-20'
        } px-4`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Admin Console</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage access, streak and scoring rules for your workspace.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Users className="text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total members</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {memberStats.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Crown className="text-amber-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {memberStats.admins}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Shield className="text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {memberStats.members}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Invite teammates, promote admins, or deactivate access.
                  </p>
                </div>
                <Button size="sm" icon={<UserPlus size={16} />} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Invite
                </Button>
              </div>

              {loadingMembers ? (
                <div className="flex justify-center py-12">
                  <Loader size="lg" />
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col gap-4 rounded-2xl border px-4 py-3 text-sm dark:border-gray-700 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                        <p className="text-gray-500 dark:text-gray-400">{member.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Streak: <strong className="text-gray-900 dark:text-white">{member.current_streak ?? 0}</strong> / {member.longest_streak ?? 0}</span>
                          <span>Productivity: <strong className="text-indigo-500">{member.productivity_score ?? 0}</strong></span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={member.role}
                          onChange={(event) => handleRoleChange(member.id, event.target.value)}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatsModal(member)}
                        >
                          Adjust
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={member.id === user?.id}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h2>
              <form className="space-y-4" onSubmit={handleInviteSubmit}>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={inviteForm.name}
                    onChange={handleInviteChange}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                    placeholder="Avery Collins"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={inviteForm.email}
                    onChange={handleInviteChange}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                    placeholder="avery@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Role</label>
                  <select
                    name="role"
                    value={inviteForm.role}
                    onChange={handleInviteChange}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
                  >
                    <option value="member">Team Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <Button type="submit" fullWidth disabled={savingInvite} icon={<UserPlus size={16} />}>
                  {savingInvite ? 'Sending...' : 'Send Invite'}
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="text-indigo-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Streak & Productivity Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure how streaks are calculated and how productivity scores are weighted.
                </p>
              </div>
            </div>
            {settings ? (
              <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSaveSettings}>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Daily streak goal</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.streakGoal}
                    onChange={(event) => handleSettingsChange(event, 'streakGoal')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Grace period (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.resetGracePeriod}
                    onChange={(event) => handleSettingsChange(event, 'resetGracePeriod')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">High priority weight</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.productivityWeights.high}
                    onChange={(event) => handleSettingsChange(event, 'productivityWeights.high')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Medium priority weight</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.productivityWeights.medium}
                    onChange={(event) => handleSettingsChange(event, 'productivityWeights.medium')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Low priority weight</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.productivityWeights.low}
                    onChange={(event) => handleSettingsChange(event, 'productivityWeights.low')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="allowManual"
                    type="checkbox"
                    checked={settings.allowManualAdjustments}
                    onChange={(event) => handleSettingsChange(event, 'allowManualAdjustments')}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-500 accent-indigo-500"
                  />
                  <label htmlFor="allowManual" className="text-sm text-gray-600 dark:text-gray-300">
                    Allow admin streak adjustments
                  </label>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={savingSettings}>
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-center py-10">
                <Loader size="lg" />
              </div>
            )}
          </section>
        </div>
      </main>

      <Modal
        isOpen={statsModalOpen}
        onClose={closeStatsModal}
        title={statsTarget ? `Adjust stats - ${statsTarget.name}` : 'Adjust stats'}
        size="sm"
      >
        <form className="space-y-4" onSubmit={handleStatsSubmit}>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Current streak</label>
            <input
              type="number"
              min="0"
              name="current_streak"
              value={statsForm.current_streak}
              onChange={handleStatsChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Longest streak</label>
            <input
              type="number"
              min="0"
              name="longest_streak"
              value={statsForm.longest_streak}
              onChange={handleStatsChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Productivity score</label>
            <input
              type="number"
              min="0"
              name="productivity_score"
              value={statsForm.productivity_score}
              onChange={handleStatsChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeStatsModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingStats}>
              {savingStats ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamManagementPage;
