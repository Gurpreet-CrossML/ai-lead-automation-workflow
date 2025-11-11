"use client"

import React, { useState } from "react";
import { Upload, RefreshCcw, CheckCircle, AlertCircle, ChevronDown, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LeadUpload() {
  const [file, setFile] = useState(null);
  const [allData, setAllData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [displayCount, setDisplayCount] = useState(30);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [newLeads, setNewLeads] = useState([]);
  const [invalidRecords, setInvalidRecords] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";
    setFile(selectedFile || null);
    setMessage("");
    setDisplayCount(30);
    setUploadSummary(null);
    setDuplicates([]);
    setNewLeads([]);
  setInvalidRecords([]);

    if (!selectedFile) return;

    try {
      const XLSX = await import("xlsx");
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      if (jsonData.length > 0) {
        const rawHeaders = jsonData[0];
        const cleanHeaders = rawHeaders.map((h) => (h || "").toString().trim());

        let lastValidIndex = cleanHeaders.length - 1;
        while (lastValidIndex >= 0 && !cleanHeaders[lastValidIndex]) {
          lastValidIndex--;
        }

        const validHeaders = cleanHeaders.slice(0, lastValidIndex + 1);
        setHeaders(validHeaders);

        const dataRows = jsonData
          .slice(1)
          .filter((row) => row.some((cell) => cell !== "" && cell !== null && cell !== undefined))
          .map((row) => row.slice(0, lastValidIndex + 1));

        setAllData(dataRows);
        setPreview(dataRows.slice(0, 30));
      }
    } catch (error) {
      setMessage("⚠️ Could not preview file. Please check format.");
      console.error(error);
    }
  };

  const handleLoadMore = () => {
    const newCount = displayCount + 30;
    setDisplayCount(newCount);
    setPreview(allData.slice(0, newCount));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("⚠️ Please select a CSV or Excel file first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call our Next.js API route instead of webhook directly
      const res = await fetch('/api/upload-leads', {
        method: "POST",
        body: formData,
      });

      const resultData = await res.json();
      console.log("📥 API Response:", resultData);

      if (res.ok) {
        // Handle array response format
        if (Array.isArray(resultData)) {
          const summaryObj = resultData.find((item) => item.summary);
          const records = resultData.filter((item) => item.status || (!item.summary && !item.message));
          const duplicateRecords = records.filter((item) => item.status === "duplicate");
          const newRecords = records.filter((item) => item.status !== "duplicate" && item.status);

          if (summaryObj?.summary) {
            setUploadSummary(summaryObj.summary);
            setDuplicates(duplicateRecords);
            setNewLeads(newRecords);
            setMessage(summaryObj.message || "✅ Upload complete!");

            setHeaders([]);
            setAllData([]);
            setPreview([]);
          } else {
            setMessage("✅ Upload finished");
          }
        } 
        // Handle nested response format
        else if (resultData?.response?.summary) {
          setUploadSummary(resultData.response.summary);
          setDuplicates(resultData.response.duplicateRecords || []);
          setNewLeads(resultData.response.newRecords || []);
          setMessage(resultData.response.message || "✅ Upload complete!");

          setHeaders([]);
          setAllData([]);
          setPreview([]);
        } 
        // Handle direct summary format
        else if (resultData?.summary) {
          setUploadSummary(resultData.summary);
          setDuplicates(resultData.duplicateRecords || []);
          setNewLeads(resultData.newRecords || []);
          setMessage(resultData.message || "✅ Upload complete!");

          setHeaders([]);
          setAllData([]);
          setPreview([]);
        } else {
          // More robust detection for validation errors from various backend shapes
          const hasInvalidArray = Array.isArray(resultData.invalidRecords) || Array.isArray(resultData.invalid_records) || Array.isArray(resultData.invalid_records || resultData.invalid);
          const hasTotalInvalid = typeof resultData.totalInvalid === 'number' && resultData.totalInvalid > 0;
          const hasValidationFlag = resultData._validation && resultData._validation.isValid === false;
          const statusIsError = typeof resultData.status === 'string' && resultData.status.toLowerCase() === 'error';

          if (hasInvalidArray || hasTotalInvalid || hasValidationFlag || statusIsError) {
            // collect raw invalid entries from possible keys; accept single object too
            let rawInvalid = resultData.invalidRecords || resultData.invalid_records || resultData.invalid || [];
            if (rawInvalid && !Array.isArray(rawInvalid) && typeof rawInvalid === 'object') {
              rawInvalid = [rawInvalid];
            }

            // If no explicit array but there is a top-level _validation and the original payload (single record) exists,
            // attempt to extract a record-like object
            if ((!rawInvalid || rawInvalid.length === 0) && resultData._validation && resultData._validation.isValid === false) {
              // try to find fields on root resultData to build a single invalid record
              rawInvalid = [resultData];
            }

            const normalized = (rawInvalid || []).map((rec) => ({
              name: [rec.first_name || rec.firstName || rec.first_name || rec.firstName || '', rec.middle_name || rec.middleName || '', rec.last_name || rec.lastName || '']
                .filter(Boolean)
                .join(' '),
              email: rec.email_address || rec.email || rec.emailAddress || null,
              company: rec.company_name || rec.company || null,
              missingFields: rec.missingFields || rec.missing_fields || rec._validation?.missingFields || rec._validation?.missing_fields || rec._validation?.missing || []
            }));

            setInvalidRecords(normalized);
            setMessage(resultData.message || '⚠️ Validation errors in file');

            // clear preview to match other branches (can be changed if you prefer to keep it)
            setHeaders([]);
            setAllData([]);
            setPreview([]);
          } else {
            setMessage("✅ Upload finished, but summary missing.");
          }
        }
      } else {
        setMessage(`❌ Upload failed: ${resultData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage("⚠️ Error: " + err.message);
      console.error("🚨 Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const hasMoreData = allData.length > displayCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upload Leads
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Upload your leads via CSV or Excel file. Ensure your file has an Email column
            
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Select File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label
                className={`flex items-center gap-3 border-2 border-dashed rounded-xl cursor-pointer px-6 py-4 transition-all shadow-sm hover:shadow-md flex-1 ${
                  file
                    ? "border-green-400 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <Upload className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold block truncate">
                    {file ? file.name : "Select CSV or Excel File"}
                  </span>
                  {file && (
                    <span className="text-xs opacity-75 block mt-1">
                      {allData.length} total rows • Click to change file
                    </span>
                  )}
                </div>
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" />
              </label>

              <Button
                onClick={handleSubmit}
                disabled={uploading || !file}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed px-8 py-6 text-base transition-all"
              >
                {uploading ? (
                  <>
                    <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Leads
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium shadow-lg flex items-center gap-3 ${
              message.startsWith("✅")
                ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-2 border-green-300 dark:border-green-800"
                : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-2 border-yellow-300 dark:border-yellow-800"
            }`}
          >
            {message.startsWith("✅") ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Invalid Records (show even when uploadSummary is not present) */}
        {invalidRecords.length > 0 && (
          <Card className="border-0 shadow-xl bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Invalid Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[500px] rounded-lg border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">#</th>
                      <th className="px-4 py-2 text-left font-semibold">Name</th>
                      <th className="px-4 py-2 text-left font-semibold">Email</th>
                      <th className="px-4 py-2 text-left font-semibold">Company</th>
                      <th className="px-4 py-2 text-left font-semibold">Missing Fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRecords.map((rec, i) => (
                      <tr key={i} className="border-b hover:bg-accent/50">
                        <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2">{rec.name || "-"}</td>
                        <td className="px-4 py-2">{rec.email || "-"}</td>
                        <td className="px-4 py-2">{rec.company || "-"}</td>
                        <td className="px-4 py-2 text-red-600 dark:text-red-400">
                          {(rec.missingFields || []).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Summary */}
        {uploadSummary && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ListChecks className="w-5 h-5" /> Upload Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-card p-4 rounded-xl shadow-md border">
                  <p className="text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{uploadSummary.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl shadow-md border border-green-200 dark:border-green-800">
                  <p className="text-muted-foreground">New Leads</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {uploadSummary.new}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-xl shadow-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-muted-foreground">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {uploadSummary.duplicates}
                  </p>
                </div>
              </div>

              {newLeads.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">New Records</h3>
                  <div className="overflow-auto max-h-[400px] rounded-lg border">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">#</th>
                          <th className="px-4 py-2 text-left font-semibold">Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Email</th>
                          <th className="px-4 py-2 text-left font-semibold">Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newLeads.map((lead, i) => (
                          <tr key={i} className="border-b hover:bg-accent/50">
                            <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-2">
                              {lead.first_name && lead.last_name
                                ? `${lead.first_name} ${lead.last_name}`
                                : "-"}
                            </td>
                            <td className="px-4 py-2">{lead.email_address || "-"}</td>
                            <td className="px-4 py-2">{lead.company_name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Duplicate Records</h3>
                  <div className="overflow-auto max-h-[400px] rounded-lg border">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">#</th>
                          <th className="px-4 py-2 text-left font-semibold">Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Email</th>
                          <th className="px-4 py-2 text-left font-semibold">Company</th>
                          <th className="px-4 py-2 text-left font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicates.map((dup, i) => (
                          <tr key={i} className="border-b hover:bg-accent/50">
                            <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-2">
                              {dup.first_name && dup.last_name
                                ? `${dup.first_name} ${dup.last_name}`
                                : "-"}
                            </td>
                            <td className="px-4 py-2">{dup.email_address || "-"}</td>
                            <td className="px-4 py-2">{dup.company_name || "-"}</td>
                            <td className="px-4 py-2 text-yellow-600 dark:text-yellow-400">
                              {dup.reason || "Duplicate entry"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              
            </CardContent>
          </Card>
        )}

        {/* Table Preview */}
        {headers.length > 0 && !uploadSummary && (
          <div className="space-y-4">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    Preview: {file?.name}
                  </CardTitle>
                  <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold">
                    Showing {preview.length} of {allData.length} rows
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold border-b-2">#</th>
                        {headers.map((header, i) => (
                          <th key={i} className="px-4 py-3 text-left font-semibold border-b-2">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-accent/50 border-b">
                          <td className="px-4 py-3 text-muted-foreground font-medium">
                            {rowIndex + 1}
                          </td>
                          {headers.map((_, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3">
                              {row[cellIndex] || <span className="text-muted-foreground">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {hasMoreData && (
              <div className="flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  className="shadow-lg hover:shadow-xl px-8 py-6 text-base"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More ({allData.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}