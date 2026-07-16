import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Award, Download, ArrowLeft, CheckCircle2, QrCode, Loader2 } from 'lucide-react';

interface Certificate {
  id: number;
  certificateUuid: string;
  issuedAt: string;
  qrCodeUrl: string;
  enrollment: {
    course: {
      title: string;
      instructorName: string;
    };
    student: {
      firstName: string;
      lastName: string;
    };
  };
}

export const CertificatePage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificate();
  }, [courseId]);

  const fetchCertificate = async () => {
    try {
      const res = await api.get(`/api/lms/courses/${courseId}/certificate`);
      setCertificate(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Certificate not available yet.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <Award className="mx-auto text-muted-foreground" size={48} />
        <h2 className="text-xl font-bold">Certificate Not Available</h2>
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          onClick={() => navigate(`/student/classroom/${courseId}`)}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90"
        >
          Complete Course to Earn Certificate
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/student/classroom/${courseId}`)}
          className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold">Your Certificate</h1>
      </div>

      {/* Certificate Design */}
      <div
        id="certificate-card"
        className="relative bg-card border-4 border-primary/30 rounded-3xl p-10 shadow-2xl overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/10 via-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-primary/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Certificate Content */}
        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center shadow-xl">
              <Award size={36} className="text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs tracking-widest uppercase text-muted-foreground font-bold">Certificate of Completion</p>
            <h2 className="text-3xl font-extrabold tracking-tight gradient-text">EduSphere AI</h2>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">This certificate is proudly awarded to</p>
            <h3 className="text-4xl font-black text-foreground">
              {certificate.enrollment?.student?.firstName} {certificate.enrollment?.student?.lastName}
            </h3>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">for successfully completing</p>
            <h4 className="text-xl font-extrabold text-primary">
              {certificate.enrollment?.course?.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              Instructed by {certificate.enrollment?.course?.instructorName}
            </p>
          </div>

          {/* Validation row */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
            <div className="text-center space-y-1">
              <div className="border-t-2 border-border w-32 pt-2">
                <p className="text-xs text-muted-foreground font-semibold">Issue Date</p>
                <p className="font-bold text-sm">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {certificate.qrCodeUrl && (
              <div className="text-center space-y-1">
                <img
                  src={certificate.qrCodeUrl}
                  alt="Verification QR"
                  className="w-20 h-20 mx-auto border border-border rounded-xl p-1 bg-white"
                />
                <p className="text-[10px] text-muted-foreground">Scan to verify</p>
              </div>
            )}

            <div className="text-center space-y-1">
              <div className="border-t-2 border-border w-32 pt-2">
                <p className="text-xs text-muted-foreground font-semibold">Certificate ID</p>
                <p className="font-mono text-xs font-bold truncate max-w-[120px] text-muted-foreground">
                  {certificate.certificateUuid?.slice(0, 18)}...
                </p>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <CheckCircle2 size={16} />
            <p className="text-xs font-semibold">Verified Certificate — UUID: {certificate.certificateUuid}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md shadow-primary/20"
        >
          <Download size={16} /> Download / Print
        </button>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-6 py-3 bg-secondary text-foreground font-bold rounded-xl border border-border hover:bg-secondary/80"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
