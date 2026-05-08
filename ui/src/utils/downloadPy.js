/**
 * Downloads a Python source string as a .py file in the browser.
 * @param {string} code - The Python source code to download.
 * @param {string} functionName - Used as the filename (e.g. "my_func" → "my_func.py").
 */
export function downloadPythonFile(code, functionName) {
  if (!code) {
    alert('No corrected code available')
    return
  }

  const blob = new Blob([code], { type: 'text/x-python' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${functionName || 'corrected'}.py`
  anchor.click()

  URL.revokeObjectURL(url)
}
