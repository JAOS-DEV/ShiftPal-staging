import React, { useState, useRef, useEffect } from "react";
import { TimeEntry, DailySubmission, Settings } from "../types";
import { useTimeCalculations } from "../hooks/useTimeCalculations";
import { usePeriodNavigation } from "../hooks/usePeriodNavigation";
import { usePeriodFilter } from "../hooks/usePeriodFilter";
import { PlusIcon, TrashIcon } from "../components/ui/icons";
import useLocalStorage from "../hooks/useLocalStorage";
import { PeriodSelector } from "../components/layout";
import ToastNotification from "../components/ui/ToastNotification";
import { TabNavigation } from "../components/layout";
import { TimeEntryForm } from "../components/timeTracker";
import { EntriesList } from "../components/timeTracker";
import { SubmitDaySection } from "../components/timeTracker";
import { TotalSection } from "../components/timeTracker";
import { HistoryView } from "../components/timeTracker";
import { EditSubmissionModal } from "../components/modals";

import InfoModal from "../components/ui/InfoModal";

interface TimeTrackerProps {
  entries: TimeEntry[];
  addEntry: (startTime: string, endTime: string) => void;
  removeEntry: (id: number) => void;
  onDailySubmit?: (submission: DailySubmission) => void;
  clearEntries?: () => void;
  settings: Settings;
  dailySubmissions: DailySubmission[];
  setDailySubmissions: (submissions: DailySubmission[]) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  entries,
  addEntry,
  removeEntry,
  onDailySubmit,
  clearEntries,
  settings,
  dailySubmissions,
  setDailySubmissions,
}) => {
  const [activeTab, setActiveTab] = useState<"tracker" | "history">("tracker");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [entriesHeight, setEntriesHeight] = useState(200); // Default fallback

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [showTimeFormatModal, setShowTimeFormatModal] = useState(false);
  const [showSubmissionInfoModal, setShowSubmissionInfoModal] = useState(false);

  // Edit modal state
  const [editingSubmission, setEditingSubmission] =
    useState<DailySubmission | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTimeErrors, setEditTimeErrors] = useState<{
    [key: string]: string;
  }>({});

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [submitDate, setSubmitDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Use shared period navigation hook
  const {
    selectedPeriod,
    setSelectedPeriod,
    selectedDate,
    setSelectedDate,
    getCurrentWeekStart,
    getCurrentMonthStart,
    goToCurrentPeriod,
    navigateWeek,
    navigateMonth,
    getPeriodLabel,
  } = usePeriodNavigation(settings);

  // Use shared period filter hook
  const filteredSubmissions = usePeriodFilter(
    dailySubmissions,
    selectedPeriod,
    selectedDate,
    settings
  );

  const {
    totalDuration,
    formatDuration,
    formatDurationWithMinutes,
    calculateDuration,
  } = useTimeCalculations(entries);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const entriesHeaderRef = useRef<HTMLHeadingElement>(null);

  // Toast effect
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ message: "", visible: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Calculate available space for entries
  useEffect(() => {
    const calculateEntriesHeight = () => {
      if (
        containerRef.current &&
        entriesHeaderRef.current &&
        formRef.current &&
        totalRef.current &&
        submitRef.current
      ) {
        const viewportHeight = window.innerHeight;
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerTop = containerRect.top;
        const availableViewportHeight = viewportHeight - containerTop;
        const headerHeight = entriesHeaderRef.current.offsetHeight;
        const formHeight = formRef.current.offsetHeight;
        const totalHeight = totalRef.current.offsetHeight;
        const submitHeight = submitRef.current.offsetHeight;

        // Account for all fixed sections: form, header, total, submit, nav bar, and padding
        const navBarHeight = 44; // Correct bottom navigation height

        // Dynamic padding that accounts for iOS safe area
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          /Safari/.test(navigator.userAgent) &&
          !/Chrome/.test(navigator.userAgent);
        const safeAreaPadding = isIOS ? 80 : 44; // Extra padding for iOS safe area
        const padding = safeAreaPadding;

        const availableHeight =
          availableViewportHeight -
          headerHeight -
          formHeight -
          totalHeight -
          submitHeight -
          navBarHeight -
          padding;
        const finalHeight = Math.max(availableHeight, 100);

        setEntriesHeight(finalHeight);
      }
    };

    calculateEntriesHeight();
    const timeoutId = setTimeout(calculateEntriesHeight, 100);

    window.addEventListener("resize", calculateEntriesHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateEntriesHeight);
    };
  }, [activeTab]); // Recalculate when tab changes

  const isValidTime = (time: string, allow24: boolean = false): boolean => {
    if (!time) return false;

    // Handle both HHMM and HH:MM formats
    let timeStr = time;
    if (time.includes(":")) {
      timeStr = time.replace(":", "");
    }

    if (timeStr.length !== 4) return false;
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (minutes < 0 || minutes > 59) return false;
    if (allow24) {
      return hours >= 0 && hours <= 24;
    }
    return hours >= 0 && hours <= 23;
  };

  const formatTimeInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/[^0-9]/g, "");

    // Limit to 4 digits
    const limited = numbers.substring(0, 4);

    // Add colon after 2 digits if we have more than 2 digits
    if (limited.length > 2) {
      return `${limited.substring(0, 2)}:${limited.substring(2)}`;
    }

    return limited;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatTimeInput(e.target.value);
    setStartTime(value);
    setStartTimeError("");

    // Only validate when the input is complete (5 characters with colon format)
    if (value.length === 5 && value.includes(":")) {
      if (!isValidTime(value)) {
        setStartTimeError("Invalid time format (HH:MM)");
      } else {
        // Auto-focus end time input
        setTimeout(() => {
          endTimeRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatTimeInput(e.target.value);
    setEndTime(value);
    setEndTimeError("");

    // Only validate when the input is complete (5 characters with colon format)
    if (value.length === 5 && value.includes(":")) {
      if (!isValidTime(value, true)) {
        setEndTimeError("Invalid time format (HH:MM)");
      }
    }
  };

  const isFormValid =
    startTime.length === 5 &&
    endTime.length === 5 &&
    startTime.includes(":") &&
    endTime.includes(":") &&
    !startTimeError &&
    !endTimeError;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Convert formatted times back to HHMM format for storage
    const formatForStorage = (time: string) => {
      return time.replace(":", "");
    };

    addEntry(formatForStorage(startTime), formatForStorage(endTime));
    setStartTime("");
    setEndTime("");
    setStartTimeError("");
    setEndTimeError("");
  };

  // Count submissions for the selected date
  const submissionsForDate = dailySubmissions.filter(
    (submission) => submission.date === submitDate
  );

  const handleSubmitDay = () => {
    if (entries.length === 0) return;

    const submission: DailySubmission = {
      date: submitDate,
      timestamp: new Date().toISOString(),
      entries: [...entries],
      totalMinutes: totalDuration.totalMinutes,
    };

    setDailySubmissions((prev) => [...prev, submission]);
    clearEntries?.();
    setToast({
      message: `Day submitted! Total: ${formatDurationWithMinutes(
        totalDuration
      )}`,
      visible: true,
    });
    onDailySubmit?.(submission);
  };

  const handleClearDay = (timestamp: string) => {
    setDailySubmissions((prev) =>
      prev.filter((submission) => submission.timestamp !== timestamp)
    );
  };

  const handleEditSubmission = (submission: DailySubmission) => {
    setEditingSubmission(submission);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedSubmission: DailySubmission) => {
    // Check if this is a new duplicated entry by checking if the original submission exists
    const originalSubmissionExists = dailySubmissions.some(
      (sub) => sub.timestamp === editingSubmission?.timestamp
    );

    if (!originalSubmissionExists && editingSubmission) {
      // This is a new duplicated entry, add it to daily submissions
      setDailySubmissions([updatedSubmission, ...dailySubmissions]);
    } else {
      // This is an existing entry being edited, update it
      setDailySubmissions(
        dailySubmissions.map((sub) =>
          sub.timestamp === editingSubmission?.timestamp
            ? updatedSubmission
            : sub
        )
      );
    }
    setShowEditModal(false);
    setEditingSubmission(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingSubmission(null);
    setEditTimeErrors({});
  };

  const handleToggleDropdown = (submissionId: string) => {
    setOpenDropdownId(openDropdownId === submissionId ? null : submissionId);
  };

  const handleCloseDropdown = () => {
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdownId &&
        !(event.target as Element).closest(".dropdown-menu")
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  const handleDuplicateSubmission = (submission: DailySubmission) => {
    // Create a copy of the submission with today's date
    const today = new Date().toISOString().split("T")[0];
    const duplicatedSubmission: DailySubmission = {
      ...submission,
      date: today,
      timestamp: new Date().toISOString(),
    };

    // Open edit modal with duplicated data
    setEditingSubmission(duplicatedSubmission);
    setShowEditModal(true);
  };

  const handleDeleteSubmission = (timestamp: string) => {
    setDailySubmissions(
      dailySubmissions.filter((sub) => sub.timestamp !== timestamp)
    );
  };

  // Edit modal validation functions
  const validateEditTimeInput = (
    time: string,
    entryIndex: number,
    field: "startTime" | "endTime"
  ): boolean => {
    if (!time) return false;

    // Handle both HHMM and HH:MM formats
    let timeStr = time;
    if (time.includes(":")) {
      timeStr = time.replace(":", "");
    }

    if (timeStr.length !== 4) return false;
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    if (isNaN(hours) || isNaN(minutes)) return false;

    const allow24 = field === "endTime";
    if (allow24) {
      return hours >= 0 && hours <= 24;
    }
    return hours >= 0 && hours <= 23;
  };

  const formatEditTimeInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/[^0-9]/g, "");

    // Limit to 4 digits
    const limited = numbers.substring(0, 4);

    // Add colon after 2 digits if we have more than 2 digits
    if (limited.length > 2) {
      return `${limited.substring(0, 2)}:${limited.substring(2)}`;
    }

    return limited;
  };

  // Helper function to calculate total duration from entries
  const calculateTotalDuration = (entries: TimeEntry[]) => {
    const totalMinutes = entries.reduce((total, entry) => {
      const startTime =
        entry.startTime.length === 4
          ? `${entry.startTime.substring(0, 2)}:${entry.startTime.substring(
              2,
              4
            )}`
          : entry.startTime;
      const endTime =
        entry.endTime.length === 4
          ? `${entry.endTime.substring(0, 2)}:${entry.endTime.substring(2, 4)}`
          : entry.endTime;
      return total + calculateDuration(startTime, endTime).totalMinutes;
    }, 0);

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col overflow-hidden relative ${
        settings.darkMode ? "text-gray-100" : "text-gray-800"
      }`}
    >
      {/* Toast Notification */}
      <ToastNotification visible={toast.visible} message={toast.message} />

      {/* Internal Navigation Tabs */}
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
      />

      {/* Content based on active tab */}
      {activeTab === "tracker" ? (
        <>
          {/* Fixed form section */}
          <div ref={formRef}>
            <TimeEntryForm
              startTime={startTime}
              endTime={endTime}
              startTimeError={startTimeError}
              endTimeError={endTimeError}
              isFormValid={isFormValid}
              settings={settings}
              onStartTimeChange={handleStartTimeChange}
              onEndTimeChange={handleEndTimeChange}
              onSubmit={handleAddEntry}
              onShowTimeFormatModal={() => setShowTimeFormatModal(true)}
              endTimeRef={endTimeRef}
            />
          </div>

          {/* Entries section with calculated height */}
          <div className="flex-1 overflow-hidden">
            <div>
              <h2
                ref={entriesHeaderRef}
                className={`text-xs font-bold tracking-wider uppercase mb-1.5 px-3 ${
                  settings.darkMode ? "text-gray-400" : "text-slate-500"
                }`}
              >
                ENTRIES
              </h2>
              <EntriesList
                entries={entries}
                entriesHeight={entriesHeight}
                settings={settings}
                onRemoveEntry={removeEntry}
                calculateDuration={calculateDuration}
                formatDurationWithMinutes={formatDurationWithMinutes}
              />
            </div>
          </div>

          {/* Fixed total section - guaranteed to be visible */}
          <div ref={totalRef}>
            <TotalSection
              totalDuration={totalDuration}
              formatDurationWithMinutes={formatDurationWithMinutes}
              settings={settings}
            />
          </div>

          {/* Submit Day Section */}
          <div ref={submitRef}>
            <SubmitDaySection
              submitDate={submitDate}
              submissionsForDate={submissionsForDate}
              entries={entries}
              settings={settings}
              onDateChange={setSubmitDate}
              onSubmitDay={handleSubmitDay}
              onShowSubmissionInfoModal={() => setShowSubmissionInfoModal(true)}
            />
          </div>
        </>
      ) : (
        <>
          {/* History View */}
          <HistoryView
            filteredSubmissions={filteredSubmissions}
            settings={settings}
            selectedPeriod={selectedPeriod}
            selectedDate={selectedDate}
            openDropdownId={openDropdownId}
            onPeriodChange={setSelectedPeriod}
            onDateChange={setSelectedDate}
            onToggleDropdown={handleToggleDropdown}
            onEditSubmission={handleEditSubmission}
            onDuplicateSubmission={handleDuplicateSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            getPeriodLabel={getPeriodLabel}
            getCurrentWeekStart={getCurrentWeekStart}
            getCurrentMonthStart={getCurrentMonthStart}
            navigateWeek={navigateWeek}
            navigateMonth={navigateMonth}
            goToCurrentPeriod={goToCurrentPeriod}
            calculateDuration={calculateDuration}
            formatDurationWithMinutes={formatDurationWithMinutes}
            calculateTotalDuration={calculateTotalDuration}
          />
        </>
      )}

      {/* Edit Modal */}
      <EditSubmissionModal
        visible={showEditModal}
        editingSubmission={editingSubmission}
        editTimeErrors={editTimeErrors}
        settings={settings}
        onCancel={handleCancelEdit}
        onSave={handleSaveEdit}
        onSubmissionChange={setEditingSubmission}
        onEditTimeErrorsChange={setEditTimeErrors}
        validateEditTimeInput={validateEditTimeInput}
        formatEditTimeInput={formatEditTimeInput}
        calculateDuration={calculateDuration}
        formatDurationWithMinutes={formatDurationWithMinutes}
        calculateTotalDuration={calculateTotalDuration}
      />

      {/* Time Format Modal */}
      <InfoModal
        isOpen={showTimeFormatModal}
        onClose={() => setShowTimeFormatModal(false)}
        title="Time Input Format"
        settings={settings}
      >
        <div className="space-y-3">
          <div>
            <h4
              className={`font-medium mb-2 ${
                settings.darkMode ? "text-gray-200" : "text-slate-700"
              }`}
            >
              24-Hour Format
            </h4>
            <p
              className={`text-sm leading-relaxed ${
                settings.darkMode ? "text-gray-300" : "text-slate-600"
              }`}
            >
              Enter times using 24-hour format (HH:MM). This means 1:00 PM is
              13:00, 2:30 PM is 14:30, and midnight is 00:00.
            </p>
          </div>

          <div>
            <h4
              className={`font-medium mb-2 ${
                settings.darkMode ? "text-gray-200" : "text-slate-700"
              }`}
            >
              Valid Examples
            </h4>
            <div
              className={`text-sm space-y-1 ${
                settings.darkMode ? "text-gray-300" : "text-slate-600"
              }`}
            >
              <p>
                • <strong>09:30</strong> - 9:30 AM
              </p>
              <p>
                • <strong>13:45</strong> - 1:45 PM
              </p>
              <p>
                • <strong>17:00</strong> - 5:00 PM
              </p>
              <p>
                • <strong>00:00</strong> - Midnight
              </p>
              <p>
                • <strong>23:59</strong> - 11:59 PM
              </p>
            </div>
          </div>

          <div>
            <h4
              className={`font-medium mb-2 ${
                settings.darkMode ? "text-gray-200" : "text-slate-700"
              }`}
            >
              Common Mistakes
            </h4>
            <div
              className={`text-sm space-y-1 ${
                settings.darkMode ? "text-gray-300" : "text-slate-600"
              }`}
            >
              <p>• Don't use AM/PM (use 13:00, not 1:00 PM)</p>
              <p>• Always use two digits (09:30, not 9:30)</p>
              <p>• Use colon separator (09:30, not 0930)</p>
            </div>
          </div>

          <div
            className={`pt-2 border-t ${
              settings.darkMode ? "border-gray-600" : "border-gray-200"
            }`}
          >
            <p
              className={`text-xs ${
                settings.darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              💡 <strong>Tip:</strong> For overnight shifts, end time can be
              after midnight (e.g., 06:00 for 6 AM the next day).
            </p>
          </div>
        </div>
      </InfoModal>

      {/* Submission Info Modal */}
      <InfoModal
        isOpen={showSubmissionInfoModal}
        onClose={() => setShowSubmissionInfoModal(false)}
        title="What's a submission?"
        settings={settings}
      >
        <div className="space-y-3">
          <p
            className={`text-sm leading-relaxed ${
              settings.darkMode ? "text-gray-300" : "text-slate-600"
            }`}
          >
            Submissions are a snapshot of the current entries. When you submit
            entries, your current entries are saved to History so you can review
            totals later.
          </p>
          <p
            className={`text-sm leading-relaxed ${
              settings.darkMode ? "text-gray-300" : "text-slate-600"
            }`}
          >
            You can keep adding entries during the day and submit multiple
            entries for a day and they will be added to the days History and
            show the total. You can also save pay in the Pay tab; it uses your
            tracked time for that date. (If in time tracker mode)
          </p>
        </div>
      </InfoModal>
    </div>
  );
};

export default TimeTracker;
