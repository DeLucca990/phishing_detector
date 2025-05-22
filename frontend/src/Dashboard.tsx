import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Hash,
  Network,
  FileCode,
  RotateCw,
  XCircle,
} from "lucide-react";
import { getExplanation, formatDateBR } from "./utils/general";

interface HistoryItem {
  id: number;
  timestamp: string;
  url: string;
  blacklisted: boolean;
  blacklist_source?: string;
  suspicious_numbers: boolean;
  excessive_subdomains: boolean;
  special_chars: boolean;
  domain_creation_date?: string;
  domain_age_days?: number;
  dynamic_dns: boolean;
  dns_records: string[];
  ssl_valid?: boolean;
  ssl_issuer?: string;
  ssl_expiration_date?: string;
  ssl_domain_match?: boolean;
  redirects: string[];
  similar_domains: { brand: string; distance: number }[];
  forms_found: number;
  login_fields_found: boolean;
  sensitive_fields_found: string[];
  suspicious_images: string[];
  ml_scores: { label: string; probability: number }[];
}

const animationStyles = document.createElement("style");
animationStyles.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;
document.head.appendChild(animationStyles);

export default function Dashboard() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/history")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const total = data.length;
  const blacklistedCount = data.filter((d) => d.blacklisted).length;
  const safeCount = total - blacklistedCount;

  const features = [
    {
      name: "Suspicious Numbers",
      count: data.filter((d) => d.suspicious_numbers).length,
      icon: <Hash className="w-4 h-4" />,
    },
    {
      name: "Subdomains",
      count: data.filter((d) => d.excessive_subdomains).length,
      icon: <Network className="w-4 h-4" />,
    },
    {
      name: "Special Chars",
      count: data.filter((d) => d.special_chars).length,
      icon: <FileCode className="w-4 h-4" />,
    },
    {
      name: "Dynamic DNS",
      count: data.filter((d) => d.dynamic_dns).length,
      icon: <RotateCw className="w-4 h-4" />,
    },
  ];

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "phishing-history.xlsx");
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
        <p className="mt-4 text-gray-600">Carregando histórico...</p>
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-gray-700 hover:text-gray-900 flex items-center gap-1 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Voltar</span>
      </button>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard de Análises
        </h1>
        <button
          onClick={exportXLSX}
          className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Exportar XLSX
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de URLs analisadas</p>
              <p className="text-2xl font-semibold">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">URLs maliciosas</p>
              <p className="text-2xl font-semibold">{blacklistedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">URLs seguras</p>
              <p className="text-2xl font-semibold">{safeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="font-semibold mb-4 text-lg">Proporção de Segurança</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Safe", value: safeCount },
                  { name: "Blacklisted", value: blacklistedCount },
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                cornerRadius={5}
              >
                {[
                  { name: "Safe", color: "#10b981" },
                  { name: "Blacklisted", color: "#ef4444" },
                ].map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} URLs`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">
                Seguro ({safeCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">
                Malicioso ({blacklistedCount})
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="font-semibold mb-4 text-lg">
            Indicadores de Phishing
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={features}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <h2 className="font-semibold p-6 border-b flex items-center justify-between">
          <span>Histórico de Análises</span>
          <div className="text-xs text-gray-500 flex items-center">
            <span className="mr-1">Deslize</span>
            <ArrowLeft className="w-3 h-3 mr-1" />
            <ArrowLeft className="w-3 h-3 transform rotate-180" />
          </div>
        </h2>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full table-auto border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-4 font-medium text-gray-600">#</th>
                <th className="p-4 font-medium text-gray-600">
                  Data de Adição
                </th>
                <th className="p-4 font-medium text-gray-600">URL</th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Status
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Sus. Numbers
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Subdomains
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Spec. Chars
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Dyn. DNS
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  SSL Valid
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Domain Age
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Forms
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  Login Fields
                </th>
                <th className="p-4 font-medium text-gray-600 text-center">
                  ML Classification
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-4 text-gray-800">{item.id}</td>
                  <td className="p-4 text-gray-800 whitespace-nowrap">
                    {formatDateBR(item.timestamp)}
                  </td>
                  <td className="p-4 text-gray-800 max-w-[200px] truncate">
                    <div className="tooltip" title={item.url}>
                      {item.url}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {item.blacklisted ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Malicioso
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Seguro
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.suspicious_numbers ? (
                      <Hash className="w-5 h-5 text-red-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.excessive_subdomains ? (
                      <Network className="w-5 h-5 text-red-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.special_chars ? (
                      <FileCode className="w-5 h-5 text-red-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.dynamic_dns ? (
                      <RotateCw className="w-5 h-5 text-red-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.ssl_valid === true ? (
                      <ShieldCheck className="w-5 h-5 text-green-500 mx-auto" />
                    ) : item.ssl_valid === false ? (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.domain_age_days !== undefined &&
                    item.domain_age_days !== null ? (
                      <span
                        className={
                          item.domain_age_days < 30
                            ? "text-red-500 font-medium"
                            : "text-gray-600"
                        }
                      >
                        {item.domain_age_days} dias
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={
                        item.forms_found > 0
                          ? "text-amber-600 font-medium"
                          : "text-gray-600"
                      }
                    >
                      {item.forms_found}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.login_fields_found ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.ml_scores.length > 0 ? (
                      item.ml_scores.some(
                        (score) =>
                          score.label === "phishing" && score.probability > 0.5
                      ) ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Phishing
                        </span>
                      ) : item.ml_scores.some(
                          (score) =>
                            score.label === "benign" && score.probability > 0.5
                        ) ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Seguro
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          -
                        </span>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div className="bg-white p-6 rounded-3xl shadow-xl w-11/12 max-w-2xl relative max-h-[80vh] overflow-y-auto scrollbar-hide animate-[scaleIn_0.3s]">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-3xl">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              Detalhes da Análise #{selected.id}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              {Object.entries(selected).map(([key, value]) => {
                if (key === "id") return null;

                const getIcon = () => {
                  if (key === "blacklisted" || key === "blacklist_source")
                    return <AlertTriangle className="w-4 h-4 text-red-500" />;
                  if (key === "url")
                    return <Network className="w-4 h-4 text-blue-500" />;
                  if (key.includes("ssl"))
                    return <ShieldCheck className="w-4 h-4 text-green-500" />;
                  return null;
                };

                const explanation = getExplanation(key);

                const isRisky =
                  (key === "blacklisted" && value === true) ||
                  (key === "suspicious_numbers" && value === true) ||
                  (key === "excessive_subdomains" && value === true) ||
                  (key === "special_chars" && value === true) ||
                  (key === "dynamic_dns" && value === true) ||
                  (key === "domain_age_days" && value && Number(value) < 30) ||
                  (key === "ssl_valid" && value === false) ||
                  (key === "ssl_domain_match" && value === false) ||
                  (key === "login_fields_found" && value === true) ||
                  (key === "forms_found" && Number(value) > 0) ||
                  (key === "similar_domains" &&
                    Array.isArray(value) &&
                    value.length > 0);

                if (key === "ml_scores") {
                  return (
                    <div
                      key={key}
                      className={`flex flex-col p-3 ${
                        isRisky ? "bg-red-50" : "bg-gray-50"
                      } rounded-2xl`}
                    >
                      <span className="font-semibold text-gray-900 mb-2 capitalize flex items-center gap-1">
                        {getIcon()}
                        {key.replace(/_/g, " ")}
                      </span>
                      <ul className="text-sm break-all bg-white p-2 rounded-2xl border border-gray-100 mb-2">
                        {value.map(
                          (
                            score: { label: string; probability: number },
                            index: number
                          ) => (
                            <li key={index}>
                              {score.label.charAt(0).toUpperCase() + score.label.slice(1)}: {(score.probability*100).toFixed(2)}%
                            </li>
                          )
                        )}
                      </ul>
                      <p className="text-xs text-gray-600 italic border-l-2 pl-2 border-gray-300">
                        {explanation}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={key}
                    className={`flex flex-col p-3 ${
                      isRisky ? "bg-red-50" : "bg-gray-50"
                    } rounded-2xl`}
                  >
                    <span className="font-semibold text-gray-900 mb-2 capitalize flex items-center gap-1">
                      {getIcon()}
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm break-all bg-white p-2 rounded-2xl border border-gray-100 mb-2">
                      {Array.isArray(value)
                        ? value
                            .map((v) =>
                              typeof v === "object"
                                ? JSON.stringify(v)
                                : String(v)
                            )
                            .join(", ")
                        : value === true
                        ? "✓ Sim"
                        : value === false
                        ? "✗ Não"
                        : String(value)}
                    </span>
                    <p className="text-xs text-gray-600 italic border-l-2 pl-2 border-gray-300">
                      {explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
