import React from 'react';
import { DateRange } from '../types';
import { validateDateRange, formatDate } from '../utils/pokemon';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  onApply: () => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  onApply,
}) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...dateRange,
      start_date: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...dateRange,
      end_date: e.target.value,
    });
  };

  const isValid = validateDateRange(dateRange.start_date, dateRange.end_date);

  const getMinDate = () => {
    const today = new Date();
    const eightDaysAgo = new Date(today);
    eightDaysAgo.setDate(today.getDate() - 8);
    return formatDate(eightDaysAgo);
  };

  const getMaxDate = () => {
    const today = new Date();
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(today.getDate() - 1);
    return formatDate(oneDayAgo);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">集計期間</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
            開始日
          </label>
          <input
            type="date"
            id="start-date"
            value={dateRange.start_date}
            onChange={handleStartDateChange}
            min={getMinDate()}
            max={getMaxDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
            終了日
          </label>
          <input
            type="date"
            id="end-date"
            value={dateRange.end_date}
            onChange={handleEndDateChange}
            min={getMinDate()}
            max={getMaxDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <button
            onClick={onApply}
            disabled={!isValid}
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            更新
          </button>
        </div>
      </div>

      {!isValid && (
        <p className="mt-2 text-sm text-red-600">
          集計期間は8日前から1日前までの範囲で、開始日は終了日以前にしてください。
        </p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        ※ 集計期間は最小8日前、最大1日前まで設定できます
      </p>
    </div>
  );
};