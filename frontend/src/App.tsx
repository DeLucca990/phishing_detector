import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { CheckCircle, XCircle, Info, LayoutDashboard } from "lucide-react";
import Dashboard from "./Dashboard";

interface URLCheckResult {
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
}

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<URLCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const checkUrl = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setShowLegend(false);
    try {
      const res = await fetch("http://localhost:8000/check_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data: URLCheckResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isMalicious = () => {
    if (!result) return false;
    return (
      result.blacklisted ||
      result.suspicious_numbers ||
      result.excessive_subdomains ||
      result.special_chars
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white flex flex-col items-center">
      <header className="w-full bg-white shadow-sm py-4">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Verificador de Phishing
          </h1>
          <Link
            to="/dashboard"
            className="flex items-center text-gray-700 hover:text-gray-900 hover:underline transition"
          >
            <LayoutDashboard className="w-5 h-5 mr-2" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-6">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <section className="bg-white p-6 rounded-2xl shadow-lg mb-6">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Digite a URL ou domínio"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
                    />
                    <button
                      onClick={checkUrl}
                      disabled={loading}
                      className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        "Verificar"
                      )}
                    </button>
                  </div>
                  {error && <p className="text-red-600 mt-3">{error}</p>}
                </section>

                {result && (
                  <section
                    className={`bg-gray-100 p-6 rounded-2xl shadow-lg border-l-4 mb-6 flex flex-col space-y-6
                      ${isMalicious() ? "border-red-500" : "border-green-500"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isMalicious() ? (
                          <XCircle className="w-8 h-8 text-red-500 mr-2" />
                        ) : (
                          <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
                        )}
                        <h2 className="text-2xl font-semibold text-gray-800">
                          {isMalicious() ? "Possivelmente Malicioso" : "Possivelmente Seguro"}
                        </h2>
                      </div>
                      <button
                        onClick={() => setShowLegend(!showLegend)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Info className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 bg-white p-6 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                          {Object.entries(result).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="font-semibold text-gray-900 mb-1 capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-sm text-gray-800 whitespace-normal break-all">
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {showLegend && (
                        <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-inner">
                          <div className="flex items-center mb-3">
                            <Info className="w-5 h-5 text-gray-800 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">
                              Legenda
                            </h3>
                          </div>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                              <span className="font-semibold">Blacklisted</span>
                              : Encontrado em lista de phishing
                            </li>
                            <li>
                              <span className="font-semibold">
                                Blacklist Source
                              </span>
                              : Origem da blacklist
                            </li>
                            <li>
                              <span className="font-semibold">
                                Suspicious Numbers
                              </span>
                              : Números no domínio substituindo letras
                            </li>
                            <li>
                              <span className="font-semibold">
                                Excessive Subdomains
                              </span>
                              : Mais de 2 subdomínios
                            </li>
                            <li>
                              <span className="font-semibold">
                                Special Chars
                              </span>
                              : Uso de caracteres não-alfanuméricos
                            </li>
                            <li>
                              <span className="font-semibold">
                                Domain Creation Date
                              </span>
                              : Data de criação do domínio
                            </li>
                            <li>
                              <span className="font-semibold">
                                Domain Age Days
                              </span>
                              : Idade do domínio em dias
                            </li>
                            <li>
                              <span className="font-semibold">Dynamic Dns</span>
                              : Uso de serviços de DNS dinâmico
                            </li>
                            <li>
                              <span className="font-semibold">Dns Records</span>
                              : Registros DNS (A, NS, MX, TXT)
                            </li>
                            <li>
                              <span className="font-semibold">Ssl Valid</span>:
                              Certificado TLS válido e não expirado
                            </li>
                            <li>
                              <span className="font-semibold">Ssl Issuer</span>:
                              Autoridade emissora do certificado
                            </li>
                            <li>
                              <span className="font-semibold">
                                Ssl Expiration Date
                              </span>
                              : Data de expiração do certificado
                            </li>
                            <li>
                              <span className="font-semibold">
                                Ssl Domain Match
                              </span>
                              : Coincidência entre domínio e certificado
                            </li>
                            <li>
                              <span className="font-semibold">Redirects</span>:
                              Redirecionamentos para domínios diferentes
                            </li>
                            <li>
                              <span className="font-semibold">
                                Similar Domains
                              </span>
                              : Domínios similares a marcas conhecidas
                            </li>
                            <li>
                              <span className="font-semibold">Forms Found</span>
                              : Número de formulários HTML na página
                            </li>
                            <li>
                              <span className="font-semibold">
                                Login Fields Found
                              </span>
                              : Presença de campos de senha em formulários
                            </li>
                            <li>
                              <span className="font-semibold">
                                Sensitive Fields Found
                              </span>
                              : Campos com nomes sensíveis (email, cpf etc.)
                            </li>
                            <li>
                              <span className="font-semibold">
                                Suspicious Images
                              </span>
                              : URLs de imagens com marcas conhecidas
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      <footer className="w-full text-center py-4 text-gray-500 text-xs">
        &copy; 2025 Phishing Detector Pedro De Lucca. Todos os direitos
        reservados.
      </footer>
    </div>
  );
}
