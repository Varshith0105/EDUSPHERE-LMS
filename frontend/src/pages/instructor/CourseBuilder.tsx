import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Loader2, ArrowLeft, Plus, Trash2, PlusCircle, Save
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CourseBuilder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [durationHours, setDurationHours] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);

  const handleListChange = (
    list: string[],
    setList: (v: string[]) => void,
    idx: number,
    val: string
  ) => {
    const updated = [...list];
    updated[idx] = val;
    setList(updated);
  };

  const addListItem = (list: string[], setList: (v: string[]) => void) => {
    setList([...list, '']);
  };

  const removeListItem = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/courses', {
        title,
        subtitle,
        description,
        thumbnailUrl,
        trailerUrl,
        price: isFree ? 0 : parseFloat(price),
        isFree,
        durationHours: parseInt(durationHours),
        categoryId: parseInt(categoryId),
        learningOutcomes: learningOutcomes.filter(Boolean),
        requirements: requirements.filter(Boolean),
      });
      setSuccess(`Course "${res.data.title}" created successfully! It is pending admin approval.`);
      setTimeout(() => navigate('/instructor/courses'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button
          onClick={() => navigate('/instructor/dashboard')}
          className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs text-primary font-bold uppercase tracking-wider">Course Builder</p>
          <h1 className="text-xl font-extrabold">Create New Course</h1>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-semibold">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Info Card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold flex items-center gap-2 text-base border-b border-border pb-3">
            <BookOpen size={18} className="text-primary" /> Course Information
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete React 19 for Beginners"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="A brief compelling subtitle for the course"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed course description..."
                rows={5}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trailer Video URL</label>
              <input
                type="url"
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (hours)</label>
              <input
                type="number"
                min="1"
                required
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="e.g. 12"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category ID</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              >
                <option value="1">Computer Science</option>
                <option value="2">Web Development</option>
                <option value="3">Artificial Intelligence</option>
                <option value="4">Business & Finance</option>
                <option value="5">Marketing</option>
              </select>
            </div>

            {/* Pricing */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Make this course FREE</span>
                </label>
                {!isFree && (
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required={!isFree}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price in USD (e.g. 49.99)"
                    className="flex-1 px-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base border-b border-border pb-3">What Students Will Learn</h2>
          {learningOutcomes.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleListChange(learningOutcomes, setLearningOutcomes, idx, e.target.value)}
                placeholder={`Outcome ${idx + 1}...`}
                className="flex-1 px-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
              <button type="button" onClick={() => removeListItem(learningOutcomes, setLearningOutcomes, idx)} className="p-2.5 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addListItem(learningOutcomes, setLearningOutcomes)} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
            <Plus size={14} /> Add Outcome
          </button>
        </div>

        {/* Requirements */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base border-b border-border pb-3">Prerequisites / Requirements</h2>
          {requirements.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleListChange(requirements, setRequirements, idx, e.target.value)}
                placeholder={`Requirement ${idx + 1}...`}
                className="flex-1 px-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
              <button type="button" onClick={() => removeListItem(requirements, setRequirements, idx)} className="p-2.5 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addListItem(requirements, setRequirements)} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
            <Plus size={14} /> Add Requirement
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 gradient-bg text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Submit Course for Approval
        </button>
      </motion.form>
    </div>
  );
};
