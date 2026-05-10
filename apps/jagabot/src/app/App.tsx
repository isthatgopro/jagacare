import { useState } from "react";
import { Mic, Send, CheckCircle2, Loader2, ChevronDown, ChevronUp, HeartPulse, User, Volume2, FileText, ClipboardList, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type ProcessingStage = {
  stage: string;
  status: "pending" | "processing" | "complete";
  result?: string;
};

type CareLog = {
  id: string;
  timestamp: Date;
  originalLanguage: "hokkien" | "mandarin" | "indonesian";
  transcription: string;
  mandarin: string;
  indonesian: string;
  hokkien?: string;
  category: "meal" | "medication" | "activity" | "hygiene" | "position" | "mood";
  riskLevel: "normal" | "watch" | "alert";
  extractedData: {
    activity?: string;
    time?: string;
    notes?: string;
  };
};

type Message = {
  id: string;
  type: "user" | "system" | "processing";
  timestamp: Date;
  content?: string;
  processing?: ProcessingStage[];
  careLog?: CareLog;
  messageNumber?: number;
};

const mockProcessPipeline = async (audioSimulated: boolean, simulatedTime: Date): Promise<CareLog> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const currentTime = format(simulatedTime, "yyyy-MM-dd HH:mm");

  const mockLogs: Omit<CareLog, "id" | "timestamp">[] = [
    // CAREGIVER LOGS (Indonesian) - More frequent as they document routine care
    {
      originalLanguage: "indonesian",
      transcription: "Sudah kasih makan siang bubur ayam 250ml dan sayur 50 gram, tapi nenek hanya habis setengah porsi saja",
      mandarin: "已經給了午餐雞肉粥250ml和蔬菜50克，但奶奶只吃完一半的份量",
      indonesian: "Sudah kasih makan siang bubur ayam 250ml dan sayur 50 gram, tapi nenek hanya habis setengah porsi saja",
      hokkien: "已經予阿嬤食中晝，雞肉糜250ml佮菜50克，毋過伊干焦食一半爾爾",
      category: "meal",
      riskLevel: "watch",
      extractedData: {
        activity: "Lunch - Chicken porridge & vegetables",
        time: currentTime,
        notes: "Prepared: 250ml porridge + 50g vegetables. Consumed: ~125ml (50%). Appetite decreased compared to yesterday."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Nenek tidak mau minum obat tekanan darah Amlodipine 5mg pagi ini. Sudah saya coba kasih 3 kali tapi dia tolak terus",
      mandarin: "奶奶今天早上不願意吃降血壓藥Amlodipine 5mg，我已經試著給了3次但她一直拒絕",
      indonesian: "Nenek tidak mau minum obat tekanan darah Amlodipine 5mg pagi ini. Sudah saya coba kasih 3 kali tapi dia tolak terus",
      hokkien: "阿嬤今仔早無愛食降血壓的藥仔Amlodipine 5mg，我已經試3擺矣，伊猶是拍拚袂食",
      category: "medication",
      riskLevel: "alert",
      extractedData: {
        activity: "Medication Administration - REFUSED",
        time: currentTime,
        notes: "Amlodipine 5mg (blood pressure) refused. Attempted 3 times. Patient became agitated. Last successful dose: yesterday 09:00. ALERT: Missing critical medication."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Sudah saya kasih obat diabetes Metformin 500mg dan vitamin D3 setelah sarapan. Nenek minum dengan air putih, tidak ada masalah",
      mandarin: "我已經給了糖尿病藥Metformin 500mg和維生素D3在早餐後。奶奶用開水服用，沒有問題",
      indonesian: "Sudah saya kasih obat diabetes Metformin 500mg dan vitamin D3 setelah sarapan. Nenek minum dengan air putih, tidak ada masalah",
      hokkien: "我已經予糖尿病的藥仔Metformin 500mg佮維生素D3，食早頓了後食的，阿嬤用開水吞，無啥物問題",
      category: "medication",
      riskLevel: "normal",
      extractedData: {
        activity: "Medication Administration - COMPLETED",
        time: currentTime,
        notes: "Metformin 500mg (diabetes) + Vitamin D3 1000IU administered post-breakfast. Taken with 200ml water. No adverse reactions. Patient cooperative."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Sudah bantu nenek mandi dan ganti baju. Kulit terlihat kering di area siku dan lutut, sudah kasih lotion",
      mandarin: "已經幫奶奶洗澡換衣服了。手肘和膝蓋的皮膚看起來乾燥，已經擦了乳液",
      indonesian: "Sudah bantu nenek mandi dan ganti baju. Kulit terlihat kering di area siku dan lutut, sudah kasih lotion",
      hokkien: "已經鬥阿嬤洗身軀換衫矣。手踭佮跤頭趺的皮膚看起來誠焦，已經抹乳液矣",
      category: "hygiene",
      riskLevel: "normal",
      extractedData: {
        activity: "Bathing & Dressing Assistance",
        time: currentTime,
        notes: "Bath completed. Dry skin noted on elbows and knees, moisturizer applied. Patient tolerated well."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Nenek sudah jalan keliling ruangan dengan walker selama 10 menit. Tidak ada keluhan, kondisi stabil",
      mandarin: "奶奶已經用助行器在房間走了10分鐘。沒有不適，狀況穩定",
      indonesian: "Nenek sudah jalan keliling ruangan dengan walker selama 10 menit. Tidak ada keluhan, kondisi stabil",
      hokkien: "阿嬤已經用行動輔助器佇房間行10分鐘矣。無啥物毋爽快，情況穩定",
      category: "activity",
      riskLevel: "normal",
      extractedData: {
        activity: "Ambulation with Walker",
        time: currentTime,
        notes: "Mobilized 10 minutes with walker assistance. Good tolerance, stable gait. No complaints."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Sudah bantu nenek ke toilet, BAB normal, tidak ada konstipasi. Sudah bersihkan dan ganti popok",
      mandarin: "已經幫奶奶上廁所，大便正常，沒有便秘。已經清潔並更換尿布",
      indonesian: "Sudah bantu nenek ke toilet, BAB normal, tidak ada konstipasi. Sudah bersihkan dan ganti popok",
      hokkien: "已經鬥阿嬤去廁所，大便正常，無便秘。已經洗予清氣閣換尿褲",
      category: "hygiene",
      riskLevel: "normal",
      extractedData: {
        activity: "Toileting Assistance",
        time: currentTime,
        notes: "Bowel movement normal, no constipation. Cleaned and changed diaper. Patient comfortable."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Sudah kasih makan malam nasi tim dengan ikan dan tahu 200 gram. Nenek habis semua, minum air 150ml",
      mandarin: "已經給了晚餐蒸飯配魚和豆腐200克。奶奶全部吃完，喝了150ml水",
      indonesian: "Sudah kasih makan malam nasi tim dengan ikan dan tahu 200 gram. Nenek habis semua, minum air 150ml",
      hokkien: "已經予阿嬤食暗頓，炊飯配魚佮豆腐200克。伊攏食了了，閣啉水150ml",
      category: "meal",
      riskLevel: "normal",
      extractedData: {
        activity: "Dinner - Steamed rice with fish & tofu",
        time: currentTime,
        notes: "Prepared: 200g steamed rice with fish & tofu. Consumed: 100% (excellent appetite). Hydration: 150ml water."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Sudah ganti sprei tempat tidur dan balik posisi nenek ke sisi kanan. Tidak ada luka tekan, kulit masih bagus",
      mandarin: "已經更換床單並將奶奶翻身到右側。沒有壓瘡，皮膚狀況良好",
      indonesian: "Sudah ganti sprei tempat tidur dan balik posisi nenek ke sisi kanan. Tidak ada luka tekan, kulit masih bagus",
      hokkien: "已經換眠床單閣共阿嬤翻身倒正爿。無褥瘡，皮膚猶真好",
      category: "position",
      riskLevel: "normal",
      extractedData: {
        activity: "Repositioning & Bed Change",
        time: currentTime,
        notes: "Bedding changed. Patient repositioned to right side. Skin assessment: no pressure injuries detected. Good skin integrity."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Sudah ukur tekanan darah 135/85, suhu 36.8 derajat, nadi 78 kali per menit. Semua dalam batas normal",
      mandarin: "已測量血壓135/85，體溫36.8度，脈搏每分鐘78次。全部都在正常範圍內",
      indonesian: "Sudah ukur tekanan darah 135/85, suhu 36.8 derajat, nadi 78 kali per menit. Semua dalam batas normal",
      hokkien: "已經量血壓135/85，體溫36.8度，心跳每分鐘78下。攏佇正常範圍內",
      category: "activity",
      riskLevel: "normal",
      extractedData: {
        activity: "Vital Signs Check",
        time: currentTime,
        notes: "BP: 135/85 mmHg, Temp: 36.8°C, Pulse: 78 bpm. All vitals within normal limits."
      }
    },
    {
      originalLanguage: "indonesian",
      transcription: "Nenek sudah tidur siang selama 2 jam. Tidur nyenyak, tidak gelisah",
      mandarin: "奶奶已經午睡2小時。睡得很安穩，沒有躁動",
      indonesian: "Nenek sudah tidur siang selama 2 jam. Tidur nyenyak, tidak gelisah",
      hokkien: "阿嬤已經睏晝2點鐘矣。睏甲誠恬，無躁動",
      category: "activity",
      riskLevel: "normal",
      extractedData: {
        activity: "Afternoon Rest",
        time: currentTime,
        notes: "Nap duration: 2 hours. Sleep quality: restful, no agitation or disturbance."
      }
    },

    // PATIENT LOGS (Hokkien) - Less frequent, mainly complaints or self-reports
    {
      originalLanguage: "hokkien",
      transcription: "我的腰脊骿誠疼，欲轉身嘛真歹勢，已經誠久無轉身矣",
      mandarin: "我的腰背很痛，要翻身也很困難，已經很久沒有翻身了",
      indonesian: "Pinggang dan punggung saya sangat sakit, sulit untuk berubah posisi, sudah lama tidak dibalik",
      category: "position",
      riskLevel: "alert",
      extractedData: {
        activity: "Patient Complaint: Back pain & positioning",
        time: currentTime,
        notes: "Patient reports severe back pain and difficulty turning. States hasn't been repositioned in long time. ALERT: Possible pressure injury risk, check repositioning schedule."
      }
    },
    {
      originalLanguage: "hokkien",
      transcription: "我無愛食這个藥仔，食了會頭暈想欲吐",
      mandarin: "我不想吃這個藥，吃了會頭暈想吐",
      indonesian: "Saya tidak mau minum obat ini, setelah minum jadi pusing dan mual",
      category: "medication",
      riskLevel: "watch",
      extractedData: {
        activity: "Patient Reports Medication Side Effects",
        time: currentTime,
        notes: "Patient refuses medication citing dizziness and nausea as side effects. Medication history needs review. Follow up with physician recommended."
      }
    },
    {
      originalLanguage: "hokkien",
      transcription: "我今仔日有淡薄仔喘，行無幾若步就真累",
      mandarin: "我今天有點喘，走沒幾步就很累",
      indonesian: "Saya hari ini agak sesak napas, jalan sedikit saja sudah capek",
      category: "activity",
      riskLevel: "watch",
      extractedData: {
        activity: "Patient Reports Breathing Difficulty",
        time: currentTime,
        notes: "Patient reports shortness of breath with minimal exertion. Monitor respiratory status. Consider checking oxygen saturation."
      }
    },
    {
      originalLanguage: "hokkien",
      transcription: "我今仔日心情誠好，頭殼誠清楚，有想欲共你講我少年時陣的代誌",
      mandarin: "我今天心情很好，頭腦很清楚，想要跟你講我年輕時候的事情",
      indonesian: "Saya hari ini merasa sangat baik, kepala jernih, ingin cerita tentang masa muda saya",
      category: "mood",
      riskLevel: "normal",
      extractedData: {
        activity: "Patient Self-Report: Mood & Cognition",
        time: currentTime,
        notes: "Patient reports feeling good, alert cognition. Expressed desire to share memories. Positive affect, good orientation."
      }
    }
  ];

  const selected = mockLogs[Math.floor(Math.random() * mockLogs.length)];

  return {
    ...selected,
    id: Date.now().toString(),
    timestamp: simulatedTime
  };
};

const getRiskColor = (level: CareLog["riskLevel"]) => {
  switch (level) {
    case "normal":
      return "text-emerald-900 bg-emerald-200 border-2 border-emerald-500";
    case "watch":
      return "text-yellow-900 bg-yellow-200 border-2 border-yellow-600";
    case "alert":
      return "text-rose-900 bg-rose-200 border-2 border-rose-600";
  }
};

const getCategoryLabel = (category: CareLog["category"]) => {
  const labels = {
    meal: "Meal",
    medication: "Medication",
    activity: "Activity",
    hygiene: "Hygiene",
    position: "Repositioning",
    mood: "Mood"
  };
  return labels[category];
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      type: "system",
      timestamp: new Date(),
      content: "Welcome to JagaBot."
    },
    {
      id: "welcome-2",
      type: "system",
      timestamp: new Date(),
      content: "Press and hold the microphone button to record care notes."
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [textInput, setTextInput] = useState("");
  const [currentSimulatedTime, setCurrentSimulatedTime] = useState(() => {
    // Start at a random time in the morning (between 8:00 and 10:00)
    const baseDate = new Date();
    baseDate.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
    return baseDate;
  });

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);

    const timer = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 5) {
          clearInterval(timer);
          handleStopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);

    // Use and increment the simulated time
    const timeForThisLog = new Date(currentSimulatedTime);

    // Increment time by random interval (30 min to 4 hours) for next log
    const nextTime = new Date(currentSimulatedTime);
    const minutesToAdd = 30 + Math.floor(Math.random() * 210); // 30 to 240 minutes
    nextTime.setMinutes(nextTime.getMinutes() + minutesToAdd);
    setCurrentSimulatedTime(nextTime);

    // Generate the care log first to know which language pipeline to show
    const careLog = await mockProcessPipeline(true, timeForThisLog);

    const isIndonesian = careLog.originalLanguage === "indonesian";

    const processingMsg: Message = {
      id: Date.now().toString(),
      type: "processing",
      timestamp: new Date(),
      processing: isIndonesian
        ? [
            { stage: "Speech Recognition (Indonesian ASR)", status: "processing" },
            { stage: "Normalize to Standard Mandarin", status: "pending" },
            { stage: "Translate to Hokkien", status: "pending" },
            { stage: "Text-to-Speech (TTS)", status: "pending" },
            { stage: "Intent & Risk Classification", status: "pending" }
          ]
        : [
            { stage: "Speech Recognition (Hokkien ASR)", status: "processing" },
            { stage: "Normalize to Standard Mandarin", status: "pending" },
            { stage: "Translate to Indonesian", status: "pending" },
            { stage: "Text-to-Speech (TTS)", status: "pending" },
            { stage: "Intent & Risk Classification", status: "pending" }
          ]
    };

    setMessages((prev) => [...prev, processingMsg]);

    const stages = processingMsg.processing!;

    for (let i = 0; i < stages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === processingMsg.id
            ? {
                ...msg,
                processing: msg.processing!.map((s, idx) =>
                  idx === i
                    ? { ...s, status: "complete" }
                    : idx === i + 1
                    ? { ...s, status: "processing" }
                    : s
                )
              }
            : msg
        )
      );
    }

    // Create result message with correct count using functional setState
    setMessages((prev) => {
      // Count messages by language type (separate counters for caregiver and patient)
      const careLogCount = prev.filter(
        (m) => m.careLog && m.careLog.originalLanguage === careLog.originalLanguage
      ).length + 1;

      const resultMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        timestamp: new Date(),
        careLog,
        messageNumber: careLogCount
      };

      return [...prev.filter((m) => m.id !== processingMsg.id), resultMsg];
    });

    toast.success("Care log saved");
  };

  return (
    <div className="size-full flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <h1 className="font-semibold text-zinc-900">JagaBot</h1>
        <p className="text-sm text-zinc-500 mt-1">Your personal voice care companion</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "system" && message.content && (
              <div className="flex justify-center">
                <div className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-full text-sm max-w-md text-center">
                  {message.content}
                </div>
              </div>
            )}

            {message.type === "processing" && message.processing && (
              <div className="bg-white border border-zinc-200 rounded-lg p-4 max-w-md">
                <div className="space-y-3">
                  {message.processing.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {stage.status === "complete" && (
                        <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                      )}
                      {stage.status === "processing" && (
                        <Loader2 className="size-5 text-blue-600 animate-spin shrink-0" />
                      )}
                      {stage.status === "pending" && (
                        <div className="size-5 rounded-full border-2 border-zinc-300 shrink-0" />
                      )}
                      <span
                        className={
                          stage.status === "complete"
                            ? "text-zinc-900 text-sm"
                            : "text-zinc-500 text-sm"
                        }
                      >
                        {stage.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {message.type === "system" && message.careLog && (
              <div
                className={`max-w-2xl ${
                  message.careLog.originalLanguage === "indonesian" ? "mr-auto" : "ml-auto"
                }`}
              >
                <div
                  className={`overflow-hidden shadow-md ${
                    message.careLog.originalLanguage === "indonesian"
                      ? "rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-100 border-l-8 border-cyan-400"
                      : "rounded-3xl bg-gradient-to-br from-amber-100 to-amber-100 border-4 border-amber-300"
                  }`}
                >
                  {/* Header */}
                  <div
                    className={`px-5 py-4 flex items-center justify-between ${
                      message.careLog.originalLanguage === "indonesian"
                        ? "bg-gradient-to-r from-cyan-500 to-cyan-500"
                        : "bg-gradient-to-r from-amber-400 to-amber-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {message.careLog.originalLanguage === "indonesian" ? (
                        <HeartPulse className="size-10 text-white drop-shadow-md" strokeWidth={3} fill="white" fillOpacity={0.2} />
                      ) : (
                        <User className="size-10 text-white drop-shadow-md" strokeWidth={3} fill="white" fillOpacity={0.3} />
                      )}
                      <div>
                        <div className="text-white font-bold text-lg">
                          {message.careLog.originalLanguage === "indonesian"
                            ? "Caregiver"
                            : "Patient"}
                        </div>
                        <div className="text-white/80 text-xs">
                          {getCategoryLabel(message.careLog.category)}
                        </div>
                      </div>
                      <span
                        className={`ml-2 text-xs px-2.5 py-1 rounded-full font-bold ${getRiskColor(
                          message.careLog.riskLevel
                        )}`}
                      >
                        {message.careLog.riskLevel === "normal" && "Normal"}
                        {message.careLog.riskLevel === "watch" && "Watch"}
                        {message.careLog.riskLevel === "alert" && "Alert"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-base">
                        #{message.messageNumber || 0} today
                      </div>
                      <div className="text-white/80 text-xs">
                        ({format(message.careLog.timestamp, "yyyy-MM-dd")})
                      </div>
                    </div>
                  </div>

                  {/* Transcription & Translation */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-1 font-medium">
                        <Mic className={`size-5 ${
                          message.careLog.originalLanguage === "indonesian"
                            ? "text-cyan-600"
                            : "text-amber-600"
                        }`} strokeWidth={3} fill="currentColor" fillOpacity={0.15} />
                        Original Recording (
                        {message.careLog.originalLanguage === "hokkien"
                          ? "Hokkien"
                          : message.careLog.originalLanguage === "indonesian"
                          ? "Indonesian"
                          : "Mandarin"}
                        )
                      </div>
                      <div className="text-sm text-zinc-900 font-medium">
                        {message.careLog.transcription}
                      </div>
                    </div>

                    <div
                      className={`relative p-4 pr-14 ${
                        message.careLog.originalLanguage === "indonesian"
                          ? "bg-amber-50 border-2 border-dashed border-amber-400 rounded-lg"
                          : "bg-cyan-50 border-2 border-dashed border-cyan-400 rounded-lg"
                      }`}
                    >
                      <div className="text-xs text-zinc-600 mb-1 font-medium">
                        Audio Output (
                        {message.careLog.originalLanguage === "indonesian"
                          ? "Hokkien for Patient"
                          : "Indonesian for Caregiver"}
                        )
                      </div>
                      <div className="text-sm text-zinc-900">
                        {message.careLog.originalLanguage === "indonesian"
                          ? message.careLog.hokkien || "台語輸出音訊"
                          : message.careLog.indonesian}
                      </div>
                      <Volume2 className={`absolute right-3 top-1/2 -translate-y-1/2 size-8 ${
                        message.careLog.originalLanguage === "indonesian"
                          ? "text-amber-400"
                          : "text-cyan-400"
                      }`} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-1">
                        <FileText className="size-5 text-zinc-500" strokeWidth={3} fill="currentColor" fillOpacity={0.1} />
                        Mandarin (for Family)
                      </div>
                      <div className="text-sm text-zinc-700">{message.careLog.mandarin}</div>
                    </div>
                  </div>

                  {/* Clinical Details */}
                  <div
                    className={`border-t-2 ${
                      message.careLog.originalLanguage === "indonesian"
                        ? "bg-cyan-100 border-cyan-300"
                        : "bg-amber-100 border-amber-200"
                    }`}
                  >
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedDetails);
                        if (newExpanded.has(message.id)) {
                          newExpanded.delete(message.id);
                        } else {
                          newExpanded.add(message.id);
                        }
                        setExpandedDetails(newExpanded);
                      }}
                      className="w-full px-5 py-3 flex items-center justify-between hover:opacity-75 transition-opacity"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 uppercase tracking-wide">
                        <ClipboardList className="size-5 text-zinc-500" strokeWidth={3} fill="currentColor" fillOpacity={0.1} />
                        Clinical Details
                      </div>
                      {expandedDetails.has(message.id) ? (
                        <ChevronUp className="size-4 text-zinc-600" />
                      ) : (
                        <ChevronDown className="size-4 text-zinc-600" />
                      )}
                    </button>

                    {expandedDetails.has(message.id) && (
                      <div className="px-5 pb-4 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          {message.careLog.extractedData.activity && (
                            <div>
                              <div className="text-xs text-zinc-600">Activity Type</div>
                              <div className="text-sm text-zinc-900 font-medium">
                                {message.careLog.extractedData.activity}
                              </div>
                            </div>
                          )}
                          {message.careLog.extractedData.time && (
                            <div>
                              <div className="text-xs text-zinc-600">Time</div>
                              <div className="text-sm text-zinc-900 font-medium">
                                {message.careLog.extractedData.time}
                              </div>
                            </div>
                          )}
                        </div>
                        {message.careLog.extractedData.notes && (
                          <div>
                            <div className="text-xs text-zinc-600">Notes</div>
                            <div className="text-sm text-zinc-900">
                              {message.careLog.extractedData.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onMouseDown={startRecording}
            onMouseUp={handleStopRecording}
            onTouchStart={startRecording}
            onTouchEnd={handleStopRecording}
            className={`size-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isRecording
                ? "bg-red-600 scale-110 shadow-lg"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Mic className="size-5 text-white" strokeWidth={3} fill="white" fillOpacity={0.15} />
          </button>

          {isRecording ? (
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-sm text-zinc-700 font-medium">
                Recording... {recordingTime}s
              </span>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type your care note here..."
                className="flex-1 px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  if (textInput.trim()) {
                    // Handle text input submission
                    setTextInput("");
                  }
                }}
                disabled={!textInput.trim()}
                className="shrink-0 transition-all"
              >
                <svg
                  className={textInput.trim() ? "size-8 text-blue-600" : "size-8 text-zinc-300"}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M5 3 L19 12 L5 21 Z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}