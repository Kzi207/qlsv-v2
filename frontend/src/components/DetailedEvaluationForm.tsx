import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { EVALUATION_DATA } from '../constants/evaluationData';
import type { Section } from '../constants/evaluationData';
import { normalizeEvidenceList } from '../utils/evidence';
import BottomBar from './drl/BottomBar';
import CriteriaRow from './drl/CriteriaRow';
import PreviewModal from './drl/PreviewModal';
import SectionCard from './drl/SectionCard';

interface Props {
  initialData?: any;
  studentDetails?: any;
  adminData?: any;
  studentId?: number;
  semester?: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
  isAdminMode?: boolean;
  onExport?: () => void;
  onClose?: () => void;
  scannedRecords?: any[];
}

const DetailedEvaluationForm: React.FC<Props> = ({
  initialData,
  studentDetails,
  adminData,
  studentId,
  semester,
  onSubmit,
  loading,
  isAdminMode,
  onExport,
  onClose,
  scannedRecords = []
}) => {
  // Manual scores entered by student
  const [manualScores, setManualScores] = useState<Record<string, number | undefined>>({});
  const [adminScores, setAdminScores] = useState<Record<string, number | undefined>>({});
  const [evidence, setEvidence] = useState<Record<string, any[]>>({});
  const [expandedSections, setExpandedSections] = useState<string[]>(['sec-1']);
  const [previewData, setPreviewData] = useState<{ files: any[]; initialIndex: number; criterionId: string } | null>(null);

  useEffect(() => {
    const manualScoreMap: Record<string, number | undefined> = {};
    const adminScoreMap: Record<string, number | undefined> = {};
    const evidenceMap: Record<string, any[]> = {};

    EVALUATION_DATA.forEach((section) => {
      section.criteria.forEach((criterion) => {
        // Load existing data
        if (studentDetails?.[criterion.id]) {
          // If we have saved data, we try to extract the "manual" part
          // TotalSaved = Manual + Scanned
          const totalSaved = Number(studentDetails[criterion.id].score || 0);
          const scanned = scannedRecords
            .filter(r => r.session.criterionId === criterion.id)
            .reduce((sum, r) => sum + r.points, 0);
          
          manualScoreMap[criterion.id] = Math.max(0, totalSaved - scanned);
          evidenceMap[criterion.id] = normalizeEvidenceList(studentDetails[criterion.id].files || []);
        } else if (initialData?.scores?.[criterion.id] !== undefined) {
          const totalInitial = Number(initialData.scores[criterion.id] || 0);
          const scanned = scannedRecords
            .filter(r => r.session.criterionId === criterion.id)
            .reduce((sum, r) => sum + r.points, 0);
          manualScoreMap[criterion.id] = Math.max(0, totalInitial - scanned);
          evidenceMap[criterion.id] = normalizeEvidenceList(initialData.evidence?.[criterion.id] || []);
        } else {
          manualScoreMap[criterion.id] = 0;
          evidenceMap[criterion.id] = [];
        }

        if (adminData?.[criterion.id] !== undefined) {
          adminScoreMap[criterion.id] = Number(adminData[criterion.id]);
        } else if (isAdminMode) {
          // For admin, we show the total student score
          const scanned = scannedRecords
            .filter(r => r.session.criterionId === criterion.id)
            .reduce((sum, r) => sum + r.points, 0);
          adminScoreMap[criterion.id] = (manualScoreMap[criterion.id] || 0) + scanned;
        } else {
          adminScoreMap[criterion.id] = undefined;
        }
      });
    });

    setManualScores(manualScoreMap);
    setAdminScores(adminScoreMap);
    setEvidence(evidenceMap);
  }, [studentDetails, adminData, initialData, isAdminMode, scannedRecords]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev.filter((sectionId) => sectionId !== id) : [...prev, id]));
  };

  // Helper to get total score for a criterion (Manual + Scanned)
  const getCriterionTotal = (criterionId: string, isForAdmin = false) => {
    if (isForAdmin && adminScores[criterionId] !== undefined) return adminScores[criterionId]!;
    
    const manual = manualScores[criterionId] || 0;
    const scanned = scannedRecords
      .filter(r => r.session.criterionId === criterionId)
      .reduce((sum, r) => sum + r.points, 0);
    
    // Find max points for this criterion
    let max = 100;
    EVALUATION_DATA.some(s => {
       const c = s.criteria.find(cr => cr.id === criterionId);
       if (c) { max = c.maxPoints; return true; }
       return false;
    });

    return Math.min(manual + scanned, max);
  };

  const calculateSectionTotal = (section: Section, isAdmin = false) => {
    let total = 0;
    section.criteria.forEach((criterion) => {
      total += getCriterionTotal(criterion.id, isAdmin);
    });
    return Math.min(total, section.maxPoints);
  };

  const grandTotal = EVALUATION_DATA.reduce((acc, section) => acc + calculateSectionTotal(section, false), 0);
  const adminGrandTotal = EVALUATION_DATA.reduce((acc, section) => acc + calculateSectionTotal(section, true), 0);

  const handleFileUpload = async (criterionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !studentId || !semester) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    formData.append('criterionId', criterionId);
    formData.append('semester', semester);
    formData.append('student_id', String(studentId));

    try {
      const res = await api.post('/training/upload-evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEvidence((prev) => ({
        ...prev,
        [criterionId]: [...(prev[criterionId] || []), ...normalizeEvidenceList(res.data.files)],
      }));
      toast.success(`Đã upload minh chứng`);
    } catch (error: any) {
      toast.error('Upload thất bại');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveEvidence = (criterionId: string, path: string) => {
    setEvidence((prev) => ({
      ...prev,
      [criterionId]: (prev[criterionId] || []).filter((file) => file.path !== path),
    }));
  };

  const handleRemoveFromPreview = (index: number) => {
    if (!previewData) return;
    const fileToRemove = previewData.files[index];
    handleRemoveEvidence(previewData.criterionId, fileToRemove.path);
    const newFiles = [...previewData.files].filter((_, i) => i !== index);
    if (newFiles.length === 0) setPreviewData(null);
    else setPreviewData({ ...previewData, files: newFiles, initialIndex: Math.min(index, newFiles.length - 1) });
  };

  const handleSubmit = () => {
    const scores: Record<string, number> = {};
    const details: Record<string, any> = {};

    EVALUATION_DATA.forEach(section => {
      section.criteria.forEach(criterion => {
        const total = getCriterionTotal(criterion.id, false);
        scores[criterion.id] = total;
        details[criterion.id] = { score: total, files: evidence[criterion.id] || [] };
      });
    });

    if (isAdminMode) {
      onSubmit({
        admin_details: adminScores,
        admin_total: adminGrandTotal,
        admin_y_thuc: calculateSectionTotal(EVALUATION_DATA[0], true),
        admin_hoat_dong: calculateSectionTotal(EVALUATION_DATA[1], true) + calculateSectionTotal(EVALUATION_DATA[2], true),
        admin_ky_luat: calculateSectionTotal(EVALUATION_DATA[3], true) + calculateSectionTotal(EVALUATION_DATA[4], true),
      });
      return;
    }

    onSubmit({
      scores,
      total: grandTotal,
      details,
      y_thuc: calculateSectionTotal(EVALUATION_DATA[0], false),
      hoat_dong: calculateSectionTotal(EVALUATION_DATA[1], false) + calculateSectionTotal(EVALUATION_DATA[2], false),
      ky_luat: calculateSectionTotal(EVALUATION_DATA[3], false) + calculateSectionTotal(EVALUATION_DATA[4], false),
    });
  };

  return (
    <>
      <div className="animate-in slide-in-from-bottom-10 fade-in space-y-4 md:space-y-8 pb-32 duration-700">
        {EVALUATION_DATA.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            studentSecTotal={calculateSectionTotal(section, false)}
            adminSecTotal={calculateSectionTotal(section, true)}
            isExpanded={expandedSections.includes(section.id)}
            isAdminMode={isAdminMode}
            onToggle={() => toggleSection(section.id)}
          >
            {section.criteria.map((criterion) => {
              const criterionScannedRecords = scannedRecords.filter(r => r.session.criterionId === criterion.id);
              return (
                <CriteriaRow
                  key={criterion.id}
                  criterion={criterion}
                  studentScore={getCriterionTotal(criterion.id, false)}
                  manualScore={manualScores[criterion.id]}
                  adminScore={adminScores[criterion.id]}
                  evidence={evidence[criterion.id] || []}
                  isAdminMode={isAdminMode}
                  scannedRecords={criterionScannedRecords}
                  onManualScoreChange={(value) => setManualScores((prev) => ({ ...prev, [criterion.id]: value }))}
                  onAdminScoreChange={(value) => setAdminScores((prev) => ({ ...prev, [criterion.id]: value }))}
                  onUpload={(event) => handleFileUpload(criterion.id, event)}
                  onViewEvidence={(path) => {
                    const files = evidence[criterion.id] || [];
                    const index = files.findIndex(f => f.path === path);
                    setPreviewData({ files, initialIndex: index >= 0 ? index : 0, criterionId: criterion.id });
                  }}
                />
              );
            })}
          </SectionCard>
        ))}

        <BottomBar
          grandTotal={grandTotal}
          adminGrandTotal={adminGrandTotal}
          onSave={handleSubmit}
          onExport={onExport}
          onClose={onClose}
          loading={loading}
          isAdminMode={isAdminMode}
        />
      </div>

      <PreviewModal
        files={previewData?.files || []}
        initialIndex={previewData?.initialIndex}
        onClose={() => setPreviewData(null)}
        onRemove={isAdminMode ? undefined : handleRemoveFromPreview}
      />
    </>
  );
};

export default DetailedEvaluationForm;
