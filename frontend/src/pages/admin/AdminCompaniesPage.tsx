import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Filter, Archive, CheckCircle,
  ExternalLink, Star, Phone, Mail, Globe, MapPin,
  RefreshCw, Edit2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Company } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminCompaniesPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    industry: 'Technology',
    website: '',
    location: '',
    about: '',
    logo_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_designation: 'Campus Recruitment Lead',
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.listCompanies({
        search: searchTerm || undefined,
        industry: industryFilter || undefined,
        include_archived: includeArchived,
      });
      setCompanies(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [industryFilter, includeArchived]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      registration_number: '',
      industry: 'Technology',
      website: '',
      location: '',
      about: '',
      logo_url: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_designation: 'Campus Recruitment Lead',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    const primaryContact = comp.contacts?.find((c) => c.is_primary) || comp.contacts?.[0];
    setFormData({
      name: comp.name,
      registration_number: comp.registration_number,
      industry: comp.industry,
      website: comp.website || '',
      location: comp.location,
      about: comp.about || '',
      logo_url: comp.logo_url || '',
      contact_name: primaryContact?.contact_name || '',
      contact_email: primaryContact?.email || '',
      contact_phone: primaryContact?.phone || '',
      contact_designation: primaryContact?.designation || 'Recruitment Lead',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, {
          name: formData.name,
          registration_number: formData.registration_number,
          industry: formData.industry,
          website: formData.website,
          location: formData.location,
          about: formData.about,
          logo_url: formData.logo_url,
        });
        showToast('Company updated successfully!', 'success');
      } else {
        await api.createCompany({
          name: formData.name,
          registration_number: formData.registration_number,
          industry: formData.industry,
          website: formData.website,
          location: formData.location,
          about: formData.about,
          logo_url: formData.logo_url,
          contacts: formData.contact_name
            ? [
                {
                  contact_name: formData.contact_name,
                  email: formData.contact_email,
                  phone: formData.contact_phone,
                  designation: formData.contact_designation,
                  is_primary: true,
                },
              ]
            : [],
        });
        showToast('Company onboarded successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async (id: number) => {
    try {
      await api.archiveCompany(id);
      showToast('Company archive state changed', 'success');
      fetchCompanies();
    } catch (err: any) {
      showToast(err.message || 'Archive failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Corporate Recruitment Partners
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Maintain authorized enterprise partner directory, compliance IDs, and campus hiring liaisons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchCompanies} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Onboard Company
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search company name, reg number, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />

          <Select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            options={[
              { value: '', label: 'All Industries' },
              { value: 'Technology', label: 'Technology' },
              { value: 'Finance & Fintech', label: 'Finance & Fintech' },
              { value: 'Healthcare & Biotech', label: 'Healthcare & Biotech' },
              { value: 'E-commerce', label: 'E-commerce' },
              { value: 'Cloud Computing', label: 'Cloud Computing' },
              { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
              { value: 'Automotive', label: 'Automotive' },
            ]}
          />

          <div className="flex items-center justify-between md:justify-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show Archived Companies
            </label>
          </div>
        </form>
      </Card>

      {/* Companies Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading corporate partners...
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No companies found"
              description="No partner companies match your current search or filter query."
              action={
                <Button variant="primary" onClick={handleOpenCreate}>
                  Onboard First Partner
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Partner Enterprise</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Roles Active</th>
                  <th className="px-4 py-3">Student Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${
                      c.is_archived ? 'opacity-50 bg-gray-50 dark:bg-gray-900/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold text-indigo-600 text-sm overflow-hidden shrink-0">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            c.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {c.name}
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-indigo-600"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            Reg: {c.registration_number}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                      {c.industry}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{c.location}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {c.active_internships_count} openings
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {c.average_rating ? c.average_rating.toFixed(1) : '5.0'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={c.is_archived ? 'default' : 'success'} size="sm">
                        {c.is_archived ? 'Archived' : 'Verified'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={c.is_archived ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleArchiveToggle(c.id)}
                          leftIcon={<Archive className="w-3.5 h-3.5" />}
                        >
                          {c.is_archived ? 'Restore' : 'Archive'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? `Edit Partner: ${editingCompany.name}` : 'Onboard New Corporate Partner'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Stripe, Google, Datadog"
            />

            <Input
              label="Official Registration / Tax Number"
              required
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              placeholder="e.g. CORP-US-89104"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Primary Industry Sector"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              options={[
                { value: 'Technology', label: 'Technology & Software' },
                { value: 'Finance & Fintech', label: 'Finance & Fintech' },
                { value: 'Healthcare & Biotech', label: 'Healthcare & Biotech' },
                { value: 'E-commerce', label: 'E-commerce & Retail' },
                { value: 'Cloud Computing', label: 'Cloud Computing' },
                { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
                { value: 'Automotive', label: 'Automotive & Robotics' },
              ]}
            />

            <Input
              label="Headquarters Location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. San Francisco, CA (or Remote)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Corporate Website URL"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://company.com"
            />

            <Input
              label="Logo Image URL (Optional)"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://img.logo.dev/company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Overview & Culture
            </label>
            <textarea
              rows={3}
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="Provide a brief summary of the company mission and internship program..."
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Primary Campus Contact (Only for new onboarding) */}
          {!editingCompany && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-3 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Primary Campus Hiring Liaison
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Contact Person Name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                />
                <Input
                  label="Official Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="s.jenkins@company.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Contact Phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1-555-019-2831"
                />
                <Input
                  label="Designation / Role"
                  value={formData.contact_designation}
                  onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                  placeholder="e.g. University Relations Manager"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              {editingCompany ? 'Save Changes' : 'Onboard Partner'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
