import { useState } from 'react'
import './App.css'

function App() {
  const [form, setForm] = useState({
    correlation_id: '',
    application_id: '',
    workspace_id: '',
    company_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('http://localhost:3001/api/bolepix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro desconhecido')
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Consulta BolePix</h1>
      <form onSubmit={handleSubmit} className="bolepix-form">
        <input
          type="text"
          name="correlation_id"
          placeholder="Correlation ID"
          value={form.correlation_id}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="application_id"
          placeholder="Application ID"
          value={form.application_id}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="workspace_id"
          placeholder="Workspace ID"
          value={form.workspace_id}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="company_id"
          placeholder="Company ID"
          value={form.company_id}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h2>Resultado</h2>
          <p><b>Descrição:</b> {result.description}</p>
          <p><b>Valor:</b> R$ {result.value}</p>
          <p><b>Status:</b> {result.status}</p>
          <p><b>Data de Emissão:</b> {result.issueDate}</p>
          <p><b>Data de Vencimento:</b> {result.dueDate}</p>
          <p><b>Nosso Número:</b> {result.ourNumber}</p>
          <p><b>Número do Documento:</b> {result.documentNumber}</p>
          <p><b>BarCode:</b> {result.barCodeFormatted}</p>
          {result.boletoUrl && (
            <p><a href={result.boletoUrl} target="_blank" rel="noopener noreferrer">Ver Boleto</a></p>
          )}
          {result.qrcode && result.qrcode.qrCodeBase64 && (
            <div>
              <b>QR Code:</b>
              <br />
              <img className="qrcode" src={`data:image/png;base64,${result.qrcode.qrCodeBase64}`} alt="QR Code" style={{maxWidth: 200}} />
              <br />
              <small>{result.qrcode.copyAndPaste}</small>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
