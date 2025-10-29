"use client"

import { useState } from "react"
import { Upload, RefreshCcw, CheckCircle, AlertCircle, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LeadUpload() {
  const [file, setFile] = useState(null)
  const [allData, setAllData] = useState([])
  const [preview, setPreview] = useState([])
  const [headers, setHeaders] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [displayCount, setDisplayCount] = useState(30)

  const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setMessage("")
    setDisplayCount(30)
    if (!selectedFile) return

    try {
      // Dynamic import of XLSX
      const XLSX = await import('xlsx')
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

      if (jsonData.length > 0) {
        // Clean headers: remove empty columns and trim whitespace
        const rawHeaders = jsonData[0]
        const cleanHeaders = rawHeaders.map(h => (h || '').toString().trim())
        
        // Find last non-empty header index
        let lastValidIndex = cleanHeaders.length - 1
        while (lastValidIndex >= 0 && !cleanHeaders[lastValidIndex]) {
          lastValidIndex--
        }
        
        // Keep only columns up to last valid header
        const validHeaders = cleanHeaders.slice(0, lastValidIndex + 1)
        setHeaders(validHeaders)
        
        // Clean data rows to match header length
        const dataRows = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== "" && cell !== null && cell !== undefined)) // Remove completely empty rows
          .map(row => row.slice(0, lastValidIndex + 1))
        
        setAllData(dataRows)
        setPreview(dataRows.slice(0, 30))
      }
    } catch (error) {
      setMessage("⚠️ Could not preview file. Please check format.")
      console.error(error)
    }
  }

  const handleLoadMore = () => {
    const newCount = displayCount + 30
    setDisplayCount(newCount)
    setPreview(allData.slice(0, newCount))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setMessage("⚠️ Please select a CSV or Excel file first.")
      return
    }

    setUploading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        setMessage(`✅ Successfully uploaded "${file.name}" with ${allData.length} leads.`)
        setTimeout(() => {
          setFile(null)
          setHeaders([])
          setPreview([])
          setAllData([])
          setDisplayCount(30)
          setMessage("")
        }, 3000)
      } else {
        setMessage("❌ Upload failed. Please check your webhook configuration.")
      }
    } catch (err) {
      setMessage("⚠️ Error: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const hasMoreData = allData.length > displayCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upload Leads
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Upload your leads via CSV or Excel file. Ensure your file has an <code className="px-2 py-1 bg-gray-200 dark:bg-neutral-800 rounded text-xs font-mono">email</code> column.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-0 shadow-lg bg-white dark:bg-neutral-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Select File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label
                className={`flex items-center gap-3 border-2 border-dashed rounded-xl cursor-pointer px-6 py-4 transition-all shadow-sm hover:shadow-md flex-1 ${
                  file 
                    ? "border-green-400 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" 
                    : "border-gray-300 dark:border-neutral-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Upload className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold block truncate">{file ? file.name : "Select CSV or Excel File"}</span>
                  {file && (
                    <span className="text-xs opacity-75 block mt-1">
                      {allData.length} total rows • Click to change file
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
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

        {/* Table Preview */}
        {headers.length > 0 ? (
          <div className="space-y-4">
            <Card className="border-0 shadow-xl bg-white dark:bg-neutral-800 overflow-hidden">
              <CardHeader className="border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Preview: {file?.name}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold">
                      Showing {preview.length} of {allData.length} rows
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap border-b-2 border-gray-200 dark:border-neutral-700">
                          #
                        </th>
                        {headers.map((header, i) => (
                          <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap border-b-2 border-gray-200 dark:border-neutral-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors border-b border-gray-100 dark:border-neutral-800">
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap font-medium">
                            {rowIndex + 1}
                          </td>
                          {headers.map((_, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {row[cellIndex] || <span className="text-gray-400 dark:text-gray-600">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Load More Button */}
            {hasMoreData && (
              <div className="flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  className="bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900 shadow-lg hover:shadow-xl transition-all px-8 py-6 text-base"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More ({allData.length - displayCount} remaining)
                </Button>
              </div>
            )}

            {/* Footer Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    📊 Total Rows: <span className="font-bold text-gray-900 dark:text-white">{allData.length}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    📋 Columns: <span className="font-bold text-gray-900 dark:text-white">{headers.length}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    👁️ Displayed: <span className="font-bold text-gray-900 dark:text-white">{preview.length}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 dark:border-neutral-700 shadow-lg bg-white dark:bg-neutral-800">
            <CardContent className="flex items-center justify-center min-h-[500px]">
              <div className="text-center p-12">
                <Upload className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">
                  No file selected
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                  Upload a CSV or Excel file to preview your leads data here
                </p>
                <div className="flex flex-col gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <p>✓ Supports .csv, .xlsx, .xls formats</p>
                  <p>✓ Preview up to 30 rows initially</p>
                  <p>✓ Load more as needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}