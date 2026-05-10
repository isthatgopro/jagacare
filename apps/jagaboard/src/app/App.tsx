import { useState } from "react";
import { Activity, AlertTriangle, Heart, Clock, TrendingUp, TrendingDown, Bell, User, Calendar, X, ChevronLeft, ChevronRight, LogOut, Bot } from "lucide-react";
import { format, subHours, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from "recharts";
import { toast } from "sonner";

type HealthReading = {
  timestamp: Date;
  systolic: number;
  diastolic: number;
  heartRate: number;
  event?: HighRiskEvent;
};

type HighRiskEvent = {
  type: "acute_confusion" | "choking" | "med_refusal" | "poor_intake" | "missed_repositioning" | "new_redness" | "fall" | "sudden_decline";
  severity: "high" | "critical";
  description: string;
};

type TimelineEvent = {
  id: string;
  timestamp: Date;
  category: "meal" | "medication" | "activity" | "hygiene" | "position" | "vital_signs" | "alert";
  description: string;
  riskLevel: "normal" | "watch" | "alert";
  details?: string;
  source: "caregiver" | "patient" | "system";
};

// Generate mock health data for the past 21 days (3 weeks)
const generateMockData = (): { healthReadings: HealthReading[]; timelineEvents: TimelineEvent[] } => {
  const now = new Date();
  const healthReadings: HealthReading[] = [];
  const timelineEvents: TimelineEvent[] = [];

  // Generate readings every 4 hours for 21 days (126 readings)
  for (let i = 126; i >= 0; i--) {
    const timestamp = subHours(now, i * 4);

    // Base vital signs with some variation
    let systolic = 125 + Math.random() * 15;
    let diastolic = 75 + Math.random() * 10;
    let heartRate = 70 + Math.random() * 15;
    let event: HighRiskEvent | undefined;

    // Inject high-risk events at specific points across all 3 weeks
    // Week 1 (most recent) - i = 0-42
    // Adjust timing to ensure 2-3 events in last 24 hours (i < 6 means last 24 hours since we're doing 4-hour intervals)
    if (i === 5) {
      systolic = 165;
      diastolic = 95;
      heartRate = 95;
      event = {
        type: "med_refusal",
        severity: "high",
        description: "Patient refused blood pressure medication (Amlodipine 5mg). Attempted 3 times. BP elevated to 165/95."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Medication Refusal - Blood Pressure Med",
        riskLevel: "alert",
        details: "Amlodipine 5mg refused. Patient agitated. BP: 165/95 mmHg",
        source: "caregiver"
      });
    }

    if (i === 3) {
      systolic = 155;
      diastolic = 88;
      heartRate = 105;
      event = {
        type: "acute_confusion",
        severity: "critical",
        description: "Patient disoriented, not recognizing family members. Elevated vital signs. Mental status change."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Acute Confusion Episode",
        riskLevel: "alert",
        details: "Patient disoriented, elevated HR: 105 bpm. Mental status evaluation needed.",
        source: "caregiver"
      });
    }

    if (i === 38) {
      event = {
        type: "choking",
        severity: "critical",
        description: "Choking incident during lunch. Food particles aspirated. Back blows administered successfully."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Choking During Meal",
        riskLevel: "alert",
        details: "Choking on solid food. Intervention successful. Swallowing assessment recommended.",
        source: "caregiver"
      });
    }

    if (i === 25) {
      event = {
        type: "missed_repositioning",
        severity: "high",
        description: "Patient not repositioned for 6 hours. New area of redness detected on sacrum."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Missed Repositioning Schedule",
        riskLevel: "alert",
        details: "6 hours without position change. New redness on sacrum detected.",
        source: "caregiver"
      });
    }

    if (i === 18) {
      event = {
        type: "poor_intake",
        severity: "high",
        description: "Patient consumed only 30% of meals throughout the day. Total intake: 400ml fluids, <500 calories."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Poor Nutritional Intake",
        riskLevel: "watch",
        details: "Only 30% meal consumption. Hydration inadequate. Nutrition consult needed.",
        source: "caregiver"
      });
    }

    if (i === 30) {
      systolic = 170;
      diastolic = 98;
      heartRate = 110;
      event = {
        type: "fall",
        severity: "critical",
        description: "Patient fell when attempting to stand unassisted. No fractures detected. Vital signs elevated post-fall."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Fall Incident",
        riskLevel: "alert",
        details: "Unassisted stand attempt resulted in fall. No injuries. Post-fall BP: 170/98, HR: 110",
        source: "caregiver"
      });
    }

    if (i === 2) {
      systolic = 148;
      diastolic = 85;
      event = {
        type: "sudden_decline",
        severity: "high",
        description: "Sudden decline in responsiveness. Patient lethargic, difficult to rouse. Physician notified."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Sudden Decline in Responsiveness",
        riskLevel: "alert",
        details: "Patient lethargic, reduced responsiveness. Physician evaluation in progress.",
        source: "caregiver"
      });
    }

    // Week 2 (8-14 days ago) - i = 43-84
    if (i === 75) {
      systolic = 160;
      diastolic = 92;
      heartRate = 98;
      event = {
        type: "med_refusal",
        severity: "high",
        description: "Patient refused morning medications including antihypertensive. BP spike observed."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Morning Medication Refusal",
        riskLevel: "alert",
        details: "Multiple medications refused. BP elevated to 160/92 mmHg",
        source: "caregiver"
      });
    }

    if (i === 68) {
      systolic = 152;
      diastolic = 86;
      heartRate = 102;
      event = {
        type: "acute_confusion",
        severity: "critical",
        description: "Patient confused about time and place. Asking for deceased relatives."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Disorientation Episode",
        riskLevel: "alert",
        details: "Time/place confusion. Asking for deceased family. HR: 102 bpm",
        source: "caregiver"
      });
    }

    if (i === 55) {
      event = {
        type: "new_redness",
        severity: "high",
        description: "Stage 1 pressure injury detected on left heel. Skin assessment performed."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "New Pressure Injury Detected",
        riskLevel: "alert",
        details: "Stage 1 pressure injury on left heel. Immediate intervention started.",
        source: "caregiver"
      });
    }

    if (i === 50) {
      systolic = 168;
      diastolic = 96;
      heartRate = 108;
      event = {
        type: "fall",
        severity: "critical",
        description: "Patient fell attempting to reach bathroom. Minor bruising on right arm."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Bathroom Fall Incident",
        riskLevel: "alert",
        details: "Fall during transfer. Minor bruising. Post-fall BP: 168/96, HR: 108",
        source: "caregiver"
      });
    }

    // Week 3 (15-21 days ago) - i = 85-126
    if (i === 115) {
      systolic = 158;
      diastolic = 90;
      heartRate = 96;
      event = {
        type: "poor_intake",
        severity: "high",
        description: "Minimal oral intake for 48 hours. Patient refusing most meals."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Severely Reduced Nutritional Intake",
        riskLevel: "alert",
        details: "48-hour poor intake. Less than 500ml fluids daily. Dietitian consulted.",
        source: "caregiver"
      });
    }

    if (i === 105) {
      event = {
        type: "choking",
        severity: "critical",
        description: "Choking on medication tablet. Heimlich maneuver performed successfully."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Choking on Medication",
        riskLevel: "alert",
        details: "Choked on tablet. Heimlich successful. Switched to liquid medications.",
        source: "caregiver"
      });
    }

    if (i === 95) {
      systolic = 145;
      diastolic = 83;
      event = {
        type: "sudden_decline",
        severity: "high",
        description: "Sudden lethargy and decreased responsiveness. Vital signs monitoring increased."
      };
      timelineEvents.push({
        id: `event-${i}`,
        timestamp,
        category: "alert",
        description: "Decreased Level of Consciousness",
        riskLevel: "alert",
        details: "Sudden lethargy. Continuous monitoring initiated. Physician notified.",
        source: "caregiver"
      });
    }

    healthReadings.push({
      timestamp,
      systolic,
      diastolic,
      heartRate,
      event
    });

    // Add normal care logs
    if (i % 6 === 0 && !event) {
      timelineEvents.push({
        id: `log-${i}-1`,
        timestamp,
        category: "vital_signs",
        description: "Vital Signs Check",
        riskLevel: "normal",
        details: `BP: ${Math.round(systolic)}/${Math.round(diastolic)} mmHg, HR: ${Math.round(heartRate)} bpm`,
        source: "caregiver"
      });
    }

    if (i % 8 === 2) {
      timelineEvents.push({
        id: `log-${i}-2`,
        timestamp: subHours(timestamp, 1),
        category: "medication",
        description: "Medication Administration",
        riskLevel: "normal",
        details: "Metformin 500mg + Vitamin D3 administered post-meal. No adverse reactions.",
        source: "caregiver"
      });
    }

    if (i % 12 === 4) {
      timelineEvents.push({
        id: `log-${i}-3`,
        timestamp: subHours(timestamp, 2),
        category: "position",
        description: "Repositioning",
        riskLevel: "normal",
        details: "Patient repositioned to right side. Skin integrity checked - no issues detected.",
        source: "caregiver"
      });
    }

    // Add some patient-reported events
    if (i % 15 === 5) {
      timelineEvents.push({
        id: `log-${i}-4`,
        timestamp: subHours(timestamp, 3),
        category: "activity",
        description: "Patient Reports Back Pain",
        riskLevel: "watch",
        details: "Patient reports mild discomfort in lower back. Requested position adjustment.",
        source: "patient"
      });
    }

    if (i % 20 === 10) {
      timelineEvents.push({
        id: `log-${i}-5`,
        timestamp: subHours(timestamp, 2),
        category: "activity",
        description: "Patient Feeling Well Today",
        riskLevel: "normal",
        details: "Patient reports good mood, alert and oriented. Expressed desire to share stories.",
        source: "patient"
      });
    }
  }

  return {
    healthReadings,
    timelineEvents: timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  };
};

const getEventTypeLabel = (type: HighRiskEvent["type"]) => {
  const labels: Record<HighRiskEvent["type"], string> = {
    acute_confusion: "Acute Confusion",
    choking: "Choking",
    med_refusal: "Medication Refusal",
    poor_intake: "Poor Intake",
    missed_repositioning: "Missed Repositioning",
    new_redness: "New Redness",
    fall: "Fall",
    sudden_decline: "Sudden Decline"
  };
  return labels[type];
};

const CustomDot = (props: any) => {
  const { cx, cy, payload, index } = props;

  if (payload.event) {
    const uniqueKey = `${payload.id || index}-${payload.timestamp}`;
    return (
      <g key={uniqueKey}>
        <circle
          key={`${uniqueKey}-inner`}
          cx={cx}
          cy={cy}
          r={8}
          fill={payload.event.severity === "critical" ? "#dc2626" : "#ea580c"}
          stroke="white"
          strokeWidth={2}
        />
        <circle
          key={`${uniqueKey}-outer`}
          cx={cx}
          cy={cy}
          r={12}
          fill="none"
          stroke={payload.event.severity === "critical" ? "#dc2626" : "#ea580c"}
          strokeWidth={2}
          opacity={0.3}
        />
      </g>
    );
  }

  return <circle key={`${payload.id || index}-${payload.timestamp}`} cx={cx} cy={cy} r={3} fill="#0891b2" />;
};

export default function App() {
  const { healthReadings, timelineEvents } = generateMockData();
  const [selectedTimeRange, setSelectedTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = most recent week, 1 = previous week, etc.

  const handleLogout = () => {
    toast.success("Logged out successfully");
  };

  const handleEmergencyAlert = (eventDescription?: string) => {
    if (eventDescription) {
      toast.success(`AI Agent activated for: ${eventDescription}. Family and emergency contacts notified.`);
    } else {
      toast.success("AI Agent activated! Emergency alert sent to family and emergency services.");
    }
  };

  // Calculate current stats
  const latestReading = healthReadings[healthReadings.length - 1];
  const alertEvents = timelineEvents.filter(e => e.riskLevel === "alert");
  const last24hAlerts = alertEvents.filter(
    e => e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
  );
  const last24hAlertsCount = last24hAlerts.length;

  // Find last repositioning event
  const lastReposition = timelineEvents.find(e => e.category === "position");
  const hoursSinceReposition = lastReposition
    ? Math.floor((Date.now() - lastReposition.timestamp.getTime()) / (1000 * 60 * 60))
    : 0;

  // Filter health readings for selected week
  const now = Date.now();
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  const weekStartTime = now - (weekOffset + 1) * weekInMs;
  const weekEndTime = now - weekOffset * weekInMs;

  const filteredReadings = healthReadings.filter(
    reading => reading.timestamp.getTime() >= weekStartTime && reading.timestamp.getTime() <= weekEndTime
  );

  // Calculate max weeks available
  const oldestReading = healthReadings[0];
  const totalWeeks = Math.ceil((now - oldestReading.timestamp.getTime()) / weekInMs);

  // Prepare chart data
  const chartData = filteredReadings.map((reading, index) => ({
    id: `reading-${index}-${reading.timestamp.getTime()}`,
    time: format(reading.timestamp, "MM/dd HH:mm"),
    timestamp: reading.timestamp.getTime(),
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    heartRate: reading.heartRate,
    event: reading.event
  }));

  const handlePreviousWeek = () => {
    if (weekOffset < totalWeeks - 1) {
      setWeekOffset(weekOffset + 1);
    }
  };

  const handleNextWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset(weekOffset - 1);
    }
  };

  return (
    <div className="size-full bg-zinc-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', letterSpacing: '-0.02em' }}>JagaBoard</h1>
            <p className="text-sm sm:text-base text-zinc-600 mt-1">Patient Health Monitoring Dashboard</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-zinc-600 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <User className="size-4 sm:size-5" />
                <span>Patient: John, Doe (江豆)</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 sm:size-5" />
                <span>{format(new Date(), "MMM dd, yyyy")}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <LogOut className="size-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Blood Pressure */}
          <div className="bg-zinc-200 border border-zinc-300 shadow-lg rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-zinc-700">Blood Pressure</div>
              <Heart className="size-8 text-zinc-700" strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-zinc-900">
              {Math.round(latestReading.systolic)}/{Math.round(latestReading.diastolic)}
            </div>
            <div className="text-xs sm:text-sm text-zinc-500 mt-1">mmHg</div>
            <div className="flex items-center gap-1 mt-2">
              {latestReading.systolic > 140 ? (
                <>
                  <TrendingUp className="size-4 text-red-600" strokeWidth={2.5} />
                  <span className="text-sm sm:text-base text-red-600 font-semibold">Elevated</span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-4 text-emerald-600" strokeWidth={2.5} />
                  <span className="text-sm sm:text-base text-emerald-600 font-semibold">Normal Range</span>
                </>
              )}
            </div>
          </div>

          {/* Heart Rate */}
          <div className="bg-zinc-200 border border-zinc-300 shadow-lg rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-zinc-700">Heart Rate</div>
              <Activity className="size-8 text-zinc-700" strokeWidth={2.5} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-zinc-900">{Math.round(latestReading.heartRate)}</div>
            <div className="text-xs sm:text-sm text-zinc-500 mt-1">bpm</div>
            <div className="flex items-center gap-1 mt-2">
              {latestReading.heartRate > 90 ? (
                <>
                  <TrendingUp className="size-4 text-amber-600" strokeWidth={2.5} />
                  <span className="text-sm sm:text-base text-amber-600 font-semibold">Above baseline</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base text-emerald-600 font-semibold">Normal</span>
                </>
              )}
            </div>
          </div>

          {/* Last Repositioning */}
          <div className="bg-zinc-200 border border-zinc-300 shadow-lg rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-zinc-700">Last Repositioning</div>
              <Clock className="size-8 text-zinc-700" strokeWidth={2.5} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-zinc-900">{hoursSinceReposition}hrs ago</div>
            <div className="text-xs sm:text-sm text-zinc-500 mt-1">
              {lastReposition ? format(lastReposition.timestamp, "MMM dd, HH:mm") : "No data"}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {hoursSinceReposition > 4 ? (
                <>
                  <AlertTriangle className="size-4 text-amber-600" strokeWidth={2.5} />
                  <span className="text-sm sm:text-base text-amber-600 font-semibold">Overdue</span>
                </>
              ) : (
                <span className="text-sm sm:text-base text-emerald-600 font-semibold">On schedule</span>
              )}
            </div>
          </div>

          {/* Alert Count */}
          <div className="bg-zinc-200 border border-zinc-300 shadow-lg rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-zinc-700">Alerts (24hrs)</div>
              <Bell className="size-8 text-zinc-700" strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
            </div>
            <button
              onClick={() => setShowAlertModal(true)}
              className="text-xl sm:text-2xl font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              {last24hAlertsCount}
            </button>
            <div className="text-xs sm:text-sm text-zinc-500 mt-1">High-risk events</div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1">
                {last24hAlertsCount > 2 ? (
                  <>
                    <TrendingUp className="size-4 text-red-600" strokeWidth={2.5} />
                    <span className="text-sm sm:text-base text-red-600 font-semibold">Above average</span>
                  </>
                ) : last24hAlertsCount > 0 ? (
                  <span className="text-sm sm:text-base text-amber-600 font-semibold">Monitor closely</span>
                ) : (
                  <span className="text-sm sm:text-base text-emerald-600 font-semibold">No alerts</span>
                )}
              </div>
              {last24hAlertsCount > 0 && (
                <button
                  onClick={() => handleEmergencyAlert()}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                  title="AI Alert"
                >
                  <Bot className="size-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Blood Pressure Timeline Chart */}
        <div id="bp-trend-chart" className="bg-zinc-200 border border-zinc-300 shadow-lg rounded-xl p-4 sm:p-6 scroll-mt-6">
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl text-zinc-900">Blood Pressure Trend</h2>
              <p className="text-sm sm:text-base text-zinc-500 mt-1">
                {weekOffset === 0
                  ? "Last 7 days with high-risk event markers"
                  : `${weekOffset * 7 + 1}-${weekOffset * 7 + 7} days ago`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousWeek}
                disabled={weekOffset >= totalWeeks - 1}
                className={`p-2 rounded-lg border transition-colors ${
                  weekOffset >= totalWeeks - 1
                    ? "border-zinc-300 text-zinc-400 cursor-not-allowed"
                    : "border-zinc-400 text-zinc-700 hover:bg-zinc-200"
                }`}
                title="Previous week"
              >
                <ChevronLeft className="size-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={handleNextWeek}
                disabled={weekOffset === 0}
                className={`p-2 rounded-lg border transition-colors ${
                  weekOffset === 0
                    ? "border-zinc-300 text-zinc-400 cursor-not-allowed"
                    : "border-zinc-400 text-zinc-700 hover:bg-zinc-200"
                }`}
                title="Next week"
              >
                <ChevronRight className="size-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" strokeWidth={1} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                stroke="#71717a"
                tickFormatter={(value, index) => {
                  if (index % 6 === 0) return value.split(" ")[0];
                  return "";
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#71717a"
                domain={[60, 180]}
                label={{ value: "mmHg", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border-2 border-zinc-300 shadow-lg p-4 rounded-lg max-w-xs">
                        <div className="font-medium text-zinc-900 mb-2">{data.time}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-600">Blood Pressure:</span>
                            <span className="font-medium text-zinc-900">
                              {Math.round(data.systolic)}/{Math.round(data.diastolic)} mmHg
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-600">Heart Rate:</span>
                            <span className="font-medium text-zinc-900">{Math.round(data.heartRate)} bpm</span>
                          </div>
                        </div>
                        {data.event && (
                          <div className="mt-3 pt-3 border-t border-zinc-200">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={`size-5 shrink-0 ${
                                data.event.severity === "critical" ? "text-red-600" : "text-orange-600"
                              }`} />
                              <div>
                                <div className={`font-medium ${
                                  data.event.severity === "critical" ? "text-red-600" : "text-orange-600"
                                }`}>
                                  {getEventTypeLabel(data.event.type)}
                                </div>
                                <div className="text-xs text-zinc-700 mt-1">{data.event.description}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={140} stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} label={{ value: "High BP", position: "right", fill: "#dc2626", fontSize: 11 }} />
              <ReferenceLine y={90} stroke="#059669" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Normal", position: "right", fill: "#059669", fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#0891b2"
                strokeWidth={2}
                dot={<CustomDot />}
                name="Systolic"
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                name="Diastolic"
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Events Log */}
        <div className="bg-zinc-200 border border-zinc-300 shadow-lg rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-zinc-300">
            <h2 className="text-lg sm:text-xl text-zinc-900">Patient Activity Timeline</h2>
            <p className="text-sm sm:text-base text-zinc-500 mt-1">Detailed care log and event history</p>
          </div>

          <div className="divide-y divide-zinc-300 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
            {timelineEvents.map((event) => (
              <div key={event.id} className={`px-4 sm:px-6 py-4 hover:bg-zinc-200 transition-colors border-l-4 ${
                event.source === "caregiver"
                  ? "border-l-cyan-500"
                  : event.source === "patient"
                  ? "border-l-amber-500"
                  : "border-l-zinc-300"
              }`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 pt-1">
                    {event.riskLevel === "alert" ? (
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <AlertTriangle className="size-5 text-red-600" strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
                      </div>
                    ) : event.riskLevel === "watch" ? (
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <AlertTriangle className="size-5 text-amber-600" strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <div className="size-5 rounded-full bg-emerald-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <div className={`font-medium text-sm sm:text-base ${
                          event.riskLevel === "alert"
                            ? "text-red-900"
                            : event.riskLevel === "watch"
                            ? "text-amber-900"
                            : "text-zinc-900"
                        }`}>
                          {event.description}
                        </div>
                        {event.details && (
                          <div className="text-xs sm:text-sm text-zinc-600 mt-1">{event.details}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <div className="text-xs sm:text-sm text-zinc-900">{format(event.timestamp, "MMM dd")}</div>
                        <div className="text-xs text-zinc-500">{format(event.timestamp, "HH:mm")}</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mt-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          event.riskLevel === "alert"
                            ? "bg-red-100 text-red-700"
                            : event.riskLevel === "watch"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {event.riskLevel === "alert" ? "Alert" : event.riskLevel === "watch" ? "Watch" : "Normal"}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          event.source === "caregiver"
                            ? "bg-cyan-100 text-cyan-700"
                            : event.source === "patient"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-100 text-zinc-700"
                        }`}>
                          {event.source === "caregiver" ? "Caregiver" : event.source === "patient" ? "Patient" : "System"}
                        </span>
                        <span className="text-xs text-zinc-500 uppercase tracking-wide">
                          {event.category.replace("_", " ")}
                        </span>
                      </div>
                      {event.riskLevel === "alert" && (
                        <button
                          onClick={() => handleEmergencyAlert(event.description)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                        >
                          <Bot className="size-3.5 sm:size-4" strokeWidth={2.5} />
                          <span className="font-medium hidden sm:inline">Our AI Alerts You in {Math.random() > 0.5 ? '1 minute' : '30 seconds'}</span>
                          <span className="font-medium sm:hidden">AI Alert</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAlertModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base sm:text-lg text-zinc-900">High-Risk Events (Last 24 Hours)</h2>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="size-5 text-zinc-600" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-[calc(80vh-80px)]">
              {last24hAlerts.length > 0 ? (
                <div className="space-y-4">
                  {last24hAlerts.map((event) => (
                    <div key={event.id} className="border border-red-200 bg-red-50 rounded-xl p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-red-100 rounded-lg shrink-0">
                          <AlertTriangle className="size-5 text-red-600" strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-sm sm:text-base text-red-900">{event.description}</div>
                              {event.details && (
                                <div className="text-xs sm:text-sm text-red-700 mt-1">{event.details}</div>
                              )}
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <div className="text-xs sm:text-sm text-red-900">{format(event.timestamp, "MMM dd")}</div>
                              <div className="text-xs text-red-600">{format(event.timestamp, "HH:mm")}</div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                event.source === "caregiver"
                                  ? "bg-cyan-100 text-cyan-700"
                                  : event.source === "patient"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-zinc-100 text-zinc-700"
                              }`}>
                                {event.source === "caregiver" ? "Caregiver" : event.source === "patient" ? "Patient" : "System"}
                              </span>
                              <span className="text-xs text-red-600 uppercase tracking-wide">
                                {event.category.replace("_", " ")}
                              </span>
                            </div>
                            <button
                              onClick={() => handleEmergencyAlert(event.description)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                            >
                              <Bot className="size-3.5 sm:size-4" strokeWidth={2.5} />
                              <span className="font-medium hidden sm:inline">Our AI Alerts You in {Math.random() > 0.5 ? '1 minute' : '30 seconds'}</span>
                              <span className="font-medium sm:hidden">AI Alert</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No high-risk events in the last 24 hours
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}