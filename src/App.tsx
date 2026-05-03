import { useState } from 'react'
import './App.css'

type ServiceStatus = 'New' | 'In Progress' | 'Completed' | 'Cancelled'

interface ServiceRequest {
  id: number
  serviceId: string
  customerName: string
  technicianId: string
  technicianName: string
  productId?: string
  productName?: string
  requestDate: string
  description: string
  status: ServiceStatus
  fee: number
}

const technicians = [
  { id: 'T-101', name: 'Ali Ahmed' },
  { id: 'T-102', name: 'Sara Mohamed' },
  { id: 'T-103', name: 'Omar Hassan' },
]

const products = [
  { id: 'P-201', name: 'Laptop' },
  { id: 'P-202', name: 'Printer' },
  { id: 'P-203', name: 'Router' },
]

function App() {
  const [serviceId, setServiceId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [technicianId, setTechnicianId] = useState(technicians[0]?.id ?? '')
  const [productId, setProductId] = useState<string | ''>('')
  const [requestDate, setRequestDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ServiceStatus>('New')
  const [fee, setFee] = useState<number | ''>('')
  const [requests, setRequests] = useState<ServiceRequest[]>([])

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceId.trim() || !customerName.trim() || !description.trim()) {
      alert('الرجاء إدخال رقم الخدمة، اسم العميل، ووصف المشكلة.')
      return
    }

    const technician = technicians.find((t) => t.id === technicianId)
    const product = products.find((p) => p.id === productId)

    const newRequest: ServiceRequest = {
      id: Date.now(),
      serviceId: serviceId.trim(),
      customerName: customerName.trim(),
      technicianId,
      technicianName: technician?.name ?? '',
      productId: product?.id,
      productName: product?.name,
      requestDate,
      description: description.trim(),
      status,
      fee: typeof fee === 'number' ? fee : 0,
    }

    setRequests((prev) => [newRequest, ...prev])

    // reset most fields except date and technician
    setServiceId('')
    setCustomerName('')
    setProductId('')
    setDescription('')
    setStatus('New')
    setFee('')
  }

  const handleStatusChange = (id: number, newStatus: ServiceStatus) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)),
    )
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="badge">G</span>
          <div>
            <h1 className="app-title">Service &amp; Maintenance</h1>
            <p className="app-subtitle">Management (7,10)</p>
          </div>
        </div>
        <div className="sidebar-section">
          <h2>Rules</h2>
          <ul>
            <li>العميل يمكنه طلب عدة خدمات صيانة.</li>
            <li>كل طلب صيانة يخصص لفني واحد فقط.</li>
            <li>الفني يمكنه التعامل مع عدة طلبات صيانة.</li>
            <li>طلب الصيانة يمكن ربطه بمنتج تم شراؤه مسبقاً.</li>
          </ul>
        </div>
        <div className="sidebar-footer">Science and Conscience</div>
      </aside>

      <main className="main">
        <section className="card">
          <h2>إنشاء طلب صيانة جديد</h2>
          <form className="form-grid" onSubmit={handleAddRequest}>
            <div className="form-field">
              <label>Service ID (Unique)</label>
              <input
                type="text"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="SR-0001"
                required
              />
            </div>

            <div className="form-field">
              <label>اسم العميل</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل"
                required
              />
            </div>

            <div className="form-field">
              <label>الفني المسؤول</label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
              >
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>المنتج المرتبط (اختياري)</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">بدون</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>تاريخ الطلب</label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>حالة الخدمة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
              >
                <option value="New">جديد</option>
                <option value="In Progress">قيد التنفيذ</option>
                <option value="Completed">مكتمل</option>
                <option value="Cancelled">ملغي</option>
              </select>
            </div>

            <div className="form-field full-width">
              <label>وصف المشكلة</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل..."
                rows={3}
                required
              />
            </div>

            <div className="form-field">
              <label>رسوم الخدمة</label>
              <input
                type="number"
                min={0}
                value={fee}
                onChange={(e) =>
                  setFee(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="form-actions">
              <button type="submit">حفظ طلب الصيانة</button>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>قائمة طلبات الصيانة</h2>
            <span className="counter">
              الإجمالي: <strong>{requests.length}</strong>
            </span>
          </div>

          {requests.length === 0 ? (
            <p className="empty-state">
              لا توجد طلبات صيانة حتى الآن. قم بإضافة أول طلب من النموذج
              أعلاه.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>العميل</th>
                    <th>الفني</th>
                    <th>المنتج</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>الرسوم</th>
                    <th>الوصف</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.serviceId}</td>
                      <td>{req.customerName}</td>
                      <td>
                        {req.technicianName} ({req.technicianId})
                      </td>
                      <td>
                        {req.productName
                          ? `${req.productName} (${req.productId})`
                          : '-'}
                      </td>
                      <td>{req.requestDate}</td>
                      <td>
                        <select
                          className={`status-select status-${req.status
                            .toLowerCase()
                            .replace(' ', '-')}`}
                          value={req.status}
                          onChange={(e) =>
                            handleStatusChange(
                              req.id,
                              e.target.value as ServiceStatus,
                            )
                          }
                        >
                          <option value="New">جديد</option>
                          <option value="In Progress">قيد التنفيذ</option>
                          <option value="Completed">مكتمل</option>
                          <option value="Cancelled">ملغي</option>
                        </select>
                      </td>
                      <td>{req.fee.toFixed(2)}</td>
                      <td className="description-cell">{req.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
