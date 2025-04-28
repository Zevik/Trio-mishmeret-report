import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useShifts } from '../contexts/ShiftContext';
import { formatHoursMinutes, calculateTimeDifference, parseDate } from '../utils/timeUtils';
import { Shift } from '../types/shift';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import UserIdentification from "./UserIdentification";
import ShiftDetails from "./ShiftDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitFormToSheets, fetchUserByIdFromSheet } from "@/utils/googleSheetsUpdated";

interface ShiftFormProps {
  shift?: Shift;
  onClose: () => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ shift, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addShift, updateShift } = useShifts();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Shift>>({
    date: shift?.date || '',
    startTime: shift?.startTime || '',
    endTime: shift?.endTime || '',
    totalHours: shift?.totalHours || 0,
    notes: shift?.notes || '',
    userId: user?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shift) {
      setFormData({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        totalHours: shift.totalHours,
        notes: shift.notes,
        userId: user?.id || '',
      });
    }
  }, [shift, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = t('errors.required');
    } else {
      const parsedDate = parseDate(formData.date);
      if (!parsedDate) {
        newErrors.date = t('errors.invalidDate');
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = t('errors.required');
    }

    if (!formData.endTime) {
      newErrors.endTime = t('errors.required');
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`${formData.date}T${formData.startTime}`);
      const end = new Date(`${formData.date}T${formData.endTime}`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        newErrors.time = t('errors.invalidTime');
      } else if (end <= start) {
        newErrors.time = t('errors.endBeforeStart');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (shift) {
        await updateShift(shift.id, formData as Shift);
        showToast(t('shift.updated'), 'success');
      } else {
        await addShift(formData as Shift);
        showToast(t('shift.added'), 'success');
      }
      onClose();
    } catch (error) {
      showToast(t('errors.saveFailed'), 'error');
    }
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (newData.startTime && newData.endTime && newData.date) {
        const start = new Date(`${newData.date}T${newData.startTime}`);
        const end = new Date(`${newData.date}T${newData.endTime}`);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const minutes = calculateTimeDifference(
            start.toISOString(),
            end.toISOString()
          );
          newData.totalHours = minutes;
        }
      }
      
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('shift.date')}
        </label>
        <input
          type="text"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          placeholder="DD.MM.YYYY"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('shift.startTime')}
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('shift.endTime')}
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {errors.time && (
        <p className="text-sm text-red-600">{errors.time}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('shift.totalHours')}
        </label>
        <input
          type="text"
          value={formatHoursMinutes(formData.totalHours || 0)}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('shift.notes')}
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {shift ? t('common.update') : t('common.save')}
        </button>
      </div>
    </form>
  );
};

export default ShiftForm;
