import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ClassMultiSelect from "@/components/ClassMultiSelect";
import {
  Download,
  FileSpreadsheet,
  CalendarIcon,
  Users,
  BookOpen,
  DoorOpen,
  GraduationCap,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";
import {
  mockClasses,
  mockTeachers,
  mockSubjects,
  mockClassrooms,
} from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Class } from "@/types";
import api from "@/services/api";

type ExportType = "date-range" | "semester";
type SemesterOption = "semester1" | "semester2" | "full-year";
type ClassSelectionMode = "single" | "multiple" | "grade";
type ExportFormat = "excel" | "pdf" | "csv";

const Export = () => {
  const { toast } = useToast();

  // Export type
  const [exportType, setExportType] = useState<ExportType>("date-range");

  // Date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Semester
  const [semester, setSemester] = useState<SemesterOption>("semester1");

  // Class selection
  const [classSelectionMode, setClassSelectionMode] =
    useState<ClassSelectionMode>("single");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  // Export format
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Real class data from API
  const [classes, setClasses] = useState<Class[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    api.get("/scheduler/classes/").then(res => {
      const data = res.data;
      setClasses(Array.isArray(data) ? data : (data.results ?? []));
    }).catch(() => {
      toast({ title: "Không thể tải danh sách lớp", variant: "destructive" });
    });
  }, []);

  const majors = useMemo(() => {
    const s = new Set<string>();
    mockClasses.forEach((c) => s.add(c.major));
    return Array.from(s);
  }, [classes]);

  const effectiveClassIds = useMemo(() => {
    if (classSelectionMode === "grade" && selectedGrade !== "all") {
      return mockClasses
        .filter((c) => c.major === selectedGrade)
        .map((c) => c.id);
    }
    return selectedClassIds;
  }, [classSelectionMode, selectedGrade, selectedClassIds, classes]);

  const generateFilename = () => {
    const classNames =
      effectiveClassIds.length <= 2
        ? effectiveClassIds
            .map((id) => mockClasses.find((c) => c.id === id)?.code)
            .filter(Boolean)
            .join("_")
        : `${effectiveClassIds.length}Classes`;
    const semLabel =
      exportType === "semester"
        ? semester === "full-year"
          ? "FullYear"
          : semester === "semester1"
            ? "HK1"
            : "HK2"
        : dateRange?.from
          ? format(dateRange.from, "ddMMyyyy")
          : "Custom";
    const ext = exportFormat === "excel" ? "xlsx" : exportFormat;
    return `Timetable_${classNames || "All"}_${semLabel}_${format(new Date(), "ddMMyyyy")}.${ext}`;
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Generating ${generateFilename()}...`,
    });
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your file is ready for download",
      });
    }, 1500);
  };

  const canExport =
    effectiveClassIds.length > 0 &&
    (exportType === "semester" || (dateRange?.from && dateRange?.to));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Export</h2>
          <p className="text-sm text-muted-foreground">
            Export timetables and data to Excel, PDF, or CSV
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Export Type */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">1. Export Type</h3>
              <RadioGroup
                value={exportType}
                onValueChange={(v) => setExportType(v as ExportType)}
                className="space-y-3"
              >
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                    exportType === "date-range"
                      ? "border-primary bg-primary/5"
                      : "border-border",
                  )}
                >
                  <RadioGroupItem value="date-range" id="date-range" />
                  <div>
                    <Label
                      htmlFor="date-range"
                      className="font-medium cursor-pointer"
                    >
                      Date Range
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Export by selecting a specific date range
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                    exportType === "semester"
                      ? "border-primary bg-primary/5"
                      : "border-border",
                  )}
                >
                  <RadioGroupItem value="semester" id="semester" />
                  <div>
                    <Label
                      htmlFor="semester"
                      className="font-medium cursor-pointer"
                    >
                      Semester
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Export by semester period
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Step 2: Date or Semester */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {exportType === "date-range"
                  ? "2. Select Date Range"
                  : "2. Select Semester"}
              </h3>
              {exportType === "date-range" ? (
                <div className="space-y-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "EEE dd/MM/yyyy")} –{" "}
                              {format(dateRange.to, "EEE dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "EEE dd/MM/yyyy")
                          )
                        ) : (
                          <span>Select date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        className="p-3 pointer-events-auto"
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2">
                    {["This Week", "Next Week", "This Month"].map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          if (preset === "This Week") {
                            const mon = new Date(today);
                            mon.setDate(today.getDate() - today.getDay() + 1);
                            const sun = new Date(mon);
                            sun.setDate(mon.getDate() + 6);
                            setDateRange({ from: mon, to: sun });
                          } else if (preset === "Next Week") {
                            const mon = new Date(today);
                            mon.setDate(today.getDate() - today.getDay() + 8);
                            const sun = new Date(mon);
                            sun.setDate(mon.getDate() + 6);
                            setDateRange({ from: mon, to: sun });
                          } else {
                            setDateRange({
                              from: new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                1,
                              ),
                              to: new Date(
                                today.getFullYear(),
                                today.getMonth() + 1,
                                0,
                              ),
                            });
                          }
                        }}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <Select
                  value={semester}
                  onValueChange={(v) => setSemester(v as SemesterOption)}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester1">Semester 1</SelectItem>
                    <SelectItem value="semester2">Semester 2</SelectItem>
                    <SelectItem value="full-year">
                      Full Academic Year
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Card>

            {/* Step 3: Class Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                3. Select Class(es)
              </h3>
              <RadioGroup
                value={classSelectionMode}
                onValueChange={(v) =>
                  setClassSelectionMode(v as ClassSelectionMode)
                }
                className="space-y-2 mb-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="single" id="cls-single" />
                  <Label htmlFor="cls-single">Single class</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="multiple" id="cls-multiple" />
                  <Label htmlFor="cls-multiple">Multiple classes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="grade" id="cls-grade" />
                  <Label htmlFor="cls-grade">By grade/major</Label>
                </div>
              </RadioGroup>

              {classSelectionMode === "grade" ? (
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Select grade/major" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {majors.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <ClassMultiSelect
                  classes={classes}
                  selectedIds={selectedClassIds}
                  onChange={(ids) => {
                    if (classSelectionMode === "single" && ids.length > 1) {
                      setSelectedClassIds([ids[ids.length - 1]]);
                    } else {
                      setSelectedClassIds(ids);
                    }
                  }}
                  placeholder={
                    classSelectionMode === "single"
                      ? "Select a class..."
                      : "Select multiple classes..."
                  }
                />
              )}
            </Card>

            {/* Step 4: Export Format */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">4. Export Format</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "excel" as const,
                    label: "Excel (.xlsx)",
                    icon: FileSpreadsheet,
                    supported: true,
                  },
                  { value: "pdf" as const, label: "PDF", icon: FileText, supported: false },
                  { value: "csv" as const, label: "CSV", icon: FileText, supported: false },
                ].map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => fmt.supported && setExportFormat(fmt.value)}
                    disabled={!fmt.supported}
                    title={!fmt.supported ? "Sắp ra mắt" : undefined}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      exportFormat === fmt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <fmt.icon
                      className={cn(
                        "h-6 w-6 mx-auto mb-2",
                        exportFormat === fmt.value
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm font-medium">{fmt.label}</span>
                    {!fmt.supported && <p className="text-xs text-muted-foreground mt-1">Sắp ra mắt</p>}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Export Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">
                    {exportType === "date-range" ? "Date Range" : "Semester"}
                  </span>
                </div>
                {exportType === "semester" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Semester:</span>
                    <span className="font-medium">
                      {semester === "full-year"
                        ? "Full Year"
                        : semester === "semester1"
                          ? "Semester 1"
                          : "Semester 2"}
                    </span>
                  </div>
                )}
                {exportType === "date-range" && dateRange?.from && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range:</span>
                    <span className="font-medium text-xs">
                      {format(dateRange.from, "EEE dd/MM")} –{" "}
                      {dateRange.to ? format(dateRange.to, "EEE dd/MM") : "..."}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Classes:</span>
                  <span className="font-medium">
                    {effectiveClassIds.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <Badge variant="secondary">
                    {exportFormat.toUpperCase()}
                  </Badge>
                </div>
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground break-all">
                  <span className="font-medium">Filename:</span>{" "}
                  {generateFilename()}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 gap-1.5"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>

              {showPreview && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                  <p className="font-medium">Preview data:</p>
                  {effectiveClassIds.slice(0, 3).map((id) => {
                    const c = mockClasses.find((x) => x.id === id);
                    return c ? (
                      <p key={id}>
                        • {c.code} — {c.name}
                      </p>
                    ) : null;
                  })}
                  {effectiveClassIds.length > 3 && (
                    <p className="text-muted-foreground">
                      ...and {effectiveClassIds.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Export Button */}
            <Card className="p-6">
              <Button
                onClick={handleExport}
                className="w-full"
                size="lg"
                disabled={!canExport || isExporting}
              >
                {isExporting
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Download className="h-4 w-4 mr-2" />}
                {isExporting ? "Đang xuất..." : "Export Data"}
              </Button>
              {!canExport && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Select class(es) and{" "}
                  {exportType === "date-range" ? "date range" : "semester"} to
                  export
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Export;
