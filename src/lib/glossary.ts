// Plain-Vietnamese glossary for the research/evidence jargon rendered in the UI.
// Keys are lowercase; GlossaryTerm resolves case-insensitively, so pass keys in
// the hyphenated lowercase form below (or rely on toLowerCase for dynamic values
// like operationalStatus / capabilityState / availability).

const TERMS: Record<string, string> = {
  // ---- Point-in-time / provenance -------------------------------------------
  asof: "Thời điểm dữ liệu được chụp — mọi phân tích chỉ dùng dữ liệu đến đúng mốc này.",
  cutoff:
    "Mốc cắt dữ liệu của nghiên cứu. Bằng chứng chỉ được tính từ dữ liệu trước mốc này, tránh nhìn thấy tương lai.",
  "point-in-time":
    "Tái dựng trạng thái đúng như tại thời điểm đó, chỉ với dữ liệu đã có lúc ấy — tránh look-ahead bias.",
  generatedat: "Thời điểm backend sinh phản hồi này; khác với mốc asOf của dữ liệu được phân tích.",
  run: "Mã của một lần chạy nghiên cứu cụ thể; dùng để truy nguyên kết quả về đúng lần chạy đó.",
  manifest:
    "File kê khai định danh một bộ artifact: liệt kê mọi file kèm hash SHA-256 để kiểm chứng toàn vẹn.",
  spec: "Hash của spec — đặc tả cấu hình đã tạo ra kết quả này; đối chiếu để biết nghiên cứu chạy theo cấu hình nào.",
  sha256:
    "Mã băm SHA-256 — 'dấu vân tay' của nội dung file; nội dung đổi thì mã đổi, dùng để chứng minh artifact không bị sửa.",
  artifact:
    "File kết quả bất biến của một lần nghiên cứu (dataset, predictions, report…), được định danh bằng hash.",
  immutable: "Không thể sửa sau khi sinh — thay đổi chỉ tạo ra artifact mới, không ghi đè.",
  provenance: "Nguồn gốc của artifact: mã nguồn, contract và các hash đã sinh ra nó — để truy nguyên.",
  integrity: "Kiểm chứng hash của artifact khớp manifest — chứng minh nội dung không bị sửa sau khi sinh.",
  snapshot: "Bản chụp dữ liệu đầu vào tại mốc asOf; bất biến để tái hiện đúng nghiên cứu.",
  evaluator: "Bộ máy đánh giá (tên + phiên bản) đã chấm artifact theo protocol đã khai báo.",
  "research-contract":
    "Hợp đồng nghiên cứu: khai báo trước protocol đo lường, cách loại trừ và ngưỡng đạt; hash của nó gắn vào artifact.",
  registry: "Sổ đăng ký artifact/quyết định phía backend; thiếu registry nghĩa là chưa có dữ liệu để truy vấn.",

  // ---- Statistics ------------------------------------------------------------
  fdr: "False Discovery Rate — ngưỡng kiểm soát tỷ lệ phát hiện giả khi kiểm định nhiều giả thuyết cùng lúc.",
  conflict:
    "Hai bằng chứng đạt ngưỡng ở cả chiều tăng và chiều giảm trên cùng horizon/metric — dữ liệu thật sự mâu thuẫn.",
  horizon: "Số nến tính từ điểm sự kiện dùng để đo kết quả — h1 nghĩa là 1 nến sau.",
  forwardreturn: "Lợi suất từ điểm sự kiện tới N nến sau — giá trị thực tế đã quan sát trong quá khứ.",
  mfe: "Maximum Favorable Excursion — biên độ đi đúng hướng xa nhất sau sự kiện trong cửa sổ horizon.",
  mae: "Maximum Adverse Excursion — biên độ đi ngược hướng sâu nhất sau sự kiện, tức rủi ro trong cửa sổ.",
  effect: "Độ lớn của hiệu ứng đo được (mức chênh lệch trung bình) — không đồng nghĩa với xác suất.",
  ci: "Confidence interval — khoảng ước lượng bất định của phép đo; càng hẹp càng chắc chắn.",
  "q-p":
    "q là p-value đã điều chỉnh cho nhiều phép kiểm định (FDR); p là giá trị thô chưa điều chỉnh. q nhỏ hơn ngưỡng mới tính là có ý nghĩa.",
  nonoverlappingpairs:
    "Số cặp mẫu không chồng lấn nhau. Các mẫu trùng cửa sổ thời gian bị loại để không đếm hai lần cùng một dữ liệu.",
  "non-overlapping":
    "Loại các ứng viên chồng lấn cửa sổ thời gian với nhau để mỗi mẫu thống kê là độc lập, không đếm trùng.",
  "sufficient-sample": "Cỡ mẫu đủ lớn theo ngưỡng đã khai báo để kết quả có ý nghĩa thống kê.",
  "mean-paired-delta": "Chênh lệch trung bình giữa hai phép đo trên cùng một cặp mẫu (paired difference).",
  n: "Cỡ mẫu — số quan sát hoặc cặp dữ liệu đi vào phép tính.",
  baseline: "Mốc so sánh tham chiếu (vd. mô hình ngây thơ); hiệu quả chỉ có nghĩa khi vượt baseline.",
  lift: "Mức vượt trội so với baseline, tính theo điểm phần trăm (pp).",
  "directional-accuracy": "Tỷ lệ dự đoán đúng hướng trên các bản ghi đã có outcome; không đo PnL.",
  interval: "Khoảng bất định của ước lượng — không phải xác suất của kết quả tương lai.",
  familywise:
    "Đã điều chỉnh cho cả họ phép kiểm định cùng lúc — chặt chẽ hơn điều chỉnh từng phép riêng lẻ.",

  // ---- Protocol / evaluation -------------------------------------------------
  oos: "Out-of-sample — đánh giá trên dữ liệu mô hình chưa từng thấy lúc huấn luyện.",
  "oos-gate":
    "Cổng kiểm chứng out-of-sample: bằng chứng phải đạt ngưỡng trên dữ liệu chưa thấy mới được coi là predictive.",
  "chronological-oos":
    "Kiểm chứng theo trình tự thời gian: huấn luyện trên quá khứ, đánh giá trên dữ liệu sau đó — mô phỏng điều kiện thật.",
  fold: "Một đoạn chia của dữ liệu trong đánh giá tuần tự; nhiều fold giúp kiểm tra độ ổn định.",
  "multiple-testing":
    "Kiểm nhiều giả thuyết cùng lúc làm tăng tỷ lệ phát hiện giả; mục này nói artifact đã hiệu chỉnh thế nào.",
  "decision-time": "Thời điểm protocol xác định một quyết định (vd. đóng nến) để ghi nhận kết quả.",
  "outcome-basis": "Loại giá dùng để tính kết quả (vd. close-to-close).",
  eligible: "Số dòng đủ điều kiện đưa vào đánh giá sau khi loại trừ.",
  excluded: "Số dòng bị loại khỏi đánh giá (thiếu outcome, lỗi dữ liệu…) — lý do nằm trong artifact.",
  "realized-horizon": "Số dòng đã chạy hết horizon — tức outcome thật đã quan sát xong.",
  "semantic-verification":
    "Kiểm tra nội dung file khớp đúng ngữ nghĩa contract, không chỉ đúng định dạng.",
  audit: "Lần rà soát dữ liệu kho (coverage, gap, chất lượng) do backend công bố.",
  ledger: "Sổ ghi lại các khoảng thiếu/gap của dữ liệu để đối chiếu khi audit.",
  "finalized-age": "Tuổi của nến đã finalized gần nhất — đo độ trễ của pipeline.",
  "invalid-duration": "Số dòng có thời lượng bất hợp lệ phát hiện trong kiểm tra chất lượng.",
  coverage: "Tỷ lệ dữ liệu thực tế có trong kho so với dữ liệu kỳ vọng.",
  "missing-bars": "Số nến kỳ vọng nhưng không có trong kho — lỗ hổng dữ liệu.",
  "gap-ranges": "Số khoảng thời gian liên tiếp bị thiếu nến trong kho.",
  "technical-indicators": "Các chỉ báo kỹ thuật tính từ giá (RSI, MACD, MA…) lưu trong bảng dẫn xuất.",
  "candle-patterns": "Các mẫu nến nhận diện được (doji, engulfing…) lưu trong bảng dẫn xuất.",
  worker: "Tiến trình nền của pipeline; trạng thái healthy/stale cho biết nó còn báo cáo đúng hạn không.",
  metric: "Một phép đo định lượng của artifact — giá trị, khoảng bất định và cỡ mẫu đi kèm.",
  "evidence-stage": "Giai đoạn bằng chứng của chức năng (mô tả → predictive → forward/live).",
  "evidence-target": "Mục tiêu bằng chứng mà chức năng cần đạt theo contract.",
  protocol:
    "Bộ quy tắc đánh giá của artifact: cách chia dữ liệu, đo outcome và hiệu chỉnh — khai báo trước trong research contract.",
  "effective-sample": "Số mẫu còn lại có giá trị thống kê sau khi loại các ứng viên chồng lấn nhau.",

  // ---- Capability / availability states --------------------------------------
  capability: "Đăng ký năng lực kỹ thuật: danh mục chức năng kèm mức trưởng thành bằng chứng của từng cái.",
  descriptive: "Bằng chứng chỉ mô tả dữ liệu đã quan sát; chưa nói gì về khả năng dự báo.",
  predictive: "Đã đo khả năng dự báo trên lịch sử, nhưng chưa hẳn đã kiểm chứng out-of-sample.",
  "validated-predictive": "Predictive đã xác thực out-of-sample — đánh giá trên dữ liệu chưa thấy.",
  "retrospective-selection-aware":
    "Phân tích hồi cố có điều chỉnh vì biết mẫu được chọn theo tiêu chí nhìn ngược (selection-aware).",
  "economic-simulation": "Mô phỏng kinh tế trên lịch sử (backtest); chưa phải kết quả forward/live.",
  "forward-observed": "Đã có kết quả quan sát trên dữ liệu forward (sau thời điểm huấn luyện), chưa hẳn là live.",
  live: "Bằng chứng thu từ hệ thống đang chạy live.",
  experimental: "Đang thử nghiệm: code chạy được nhưng bằng chứng chưa đủ để kết luận.",
  validated: "Đã qua kiểm chứng theo protocol đã khai báo.",
  retired: "Chức năng đã ngừng, chỉ giữ để đối chiếu lịch sử.",
  legacy: "Bản ghi/pipeline đời cũ giữ lại để đối chiếu; không nằm trong contract hiện tại.",
  operational: "Chức năng đã triển khai và đang hoạt động.",
  degraded: "Đang hoạt động nhưng suy giảm hoặc không đầy đủ.",
  unavailable: "Không khả dụng — không có dữ liệu/bằng chứng để hiển thị; UI không tự suy diễn.",
  "unavailable-module": "Module pipeline không trả dữ liệu cho khung này; lý do giữ nguyên từ backend.",
  partial: "Chỉ có một phần dữ liệu/coverage — vẫn tính là thiếu bằng chứng.",
  available: "Dữ liệu khả dụng đầy đủ theo audit.",
  stale: "Dữ liệu đã quá hạn freshness — cũ hơn ngưỡng cho phép; không dùng làm quyết định mới.",
  freshness: "Độ tươi của dữ liệu: khoảng cách từ nến mới nhất tới hiện tại so với timeframe.",
  healthy: "Worker đang chạy và báo cáo đúng hạn.",
  lock: "Khóa pipeline: chống hai lần chạy song song ghi đè artifact.",
  abstain: "Hệ thống từ chối đưa nhận định vì bằng chứng không đạt ngưỡng — an toàn hơn là đoán.",
  abstention: "Tỷ lệ lần hệ thống chọn abstain (không trả lời) vì bằng chứng quá yếu.",
  "model-unavailable":
    "Mô hình không khả dụng cho cấu hình này — chưa đủ điều kiện hoặc chưa qua promotion gate.",

  // ---- Historical analog / archetype ------------------------------------------
  analog: "Đoạn lịch sử giống cửa sổ hiện tại nhất; dùng để đối chiếu, không phải dự báo.",
  "shape-similarity": "Độ giống về hình dạng nến (biên độ, thứ tự) giữa hai cửa sổ.",
  "context-similarity":
    "Độ giống về bối cảnh (trend, volatility…) giữa hai cửa sổ — chỉ để đối chiếu, không xếp hạng.",
  "close-to-close":
    "Đo từ giá đóng cửa tới giá đóng cửa sau N nến — cách đo outcome chuẩn của hệ thống.",
  ohlc: "Open-High-Low-Close: giá mở, cao nhất, thấp nhất và đóng của một nến.",
  klines: "Tên Binance gọi dữ liệu nến OHLC — nguồn giá đóng cửa chuẩn của hệ thống.",
  "centroid-distance": "Khoảng cách từ mẫu này tới tâm (centroid) của archetype — nhỏ nghĩa là mẫu điển hình hơn.",
  atr: "Average True Range — biên độ dao động trung bình của nến, dùng lọc nhiễu.",
  "round-trip-cost":
    "Chi phí tham chiếu khứ hồi (vào + ra) dùng làm ngưỡng phân loại; không phải phí đã trừ vào PnL.",
  "exclusion-zone": "Số nến bị loại quanh mỗi analog để tránh đếm trùng các mẫu chồng lấn.",
  "method-version": "Phiên bản thuật toán tìm analog (vd. cosine-similarity theo hình dạng, point-in-time).",

  // ---- Prediction / paper trading ---------------------------------------------
  "promotion-gate": "Cổng nâng cấp model: phải đạt tiêu chuẩn kiểm chứng mới được phục vụ dự đoán.",
  "promotion-evidence": "Bằng chứng đủ chuẩn để qua promotion gate; raw/legacy evaluation chưa đạt chuẩn này.",
  validity: "Trạng thái hợp lệ của bản ghi (Valid/Invalid/Legacy) — Invalid/Legacy không được dùng để kết luận.",
  valid: "Bản ghi hợp lệ theo contract hiện tại.",
  invalid: "Bản ghi sai cấu trúc hoặc vi phạm contract — không được dùng để kết luận.",
  "prediction-evaluation":
    "Bảng đánh giá các dự đoán đã ghi: đếm đúng/sai theo outcome thật. Kết quả này chưa qua promotion gate.",
  inference: "Thời gian model mất để sinh dự đoán cho cửa sổ này, tính bằng mili-giây.",
  pipeline: "Phiên bản pipeline sinh dự đoán/bằng chứng; đổi version nghĩa là đổi cách tính.",
  evaluation: "Phiên bản bộ đánh giá kết quả dự đoán.",
  "model-probability": "Xác suất model tự gán cho từng hướng giá; không phải tỷ lệ thắng đã kiểm chứng.",
  confidence: "Độ tự tin model tự báo cáo cho dự đoán — không phải độ chính xác đo được.",
  "raw-legacy": "Thống kê trên toàn bộ bản ghi lịch sử thô, kể cả duplicate và lỗi — chỉ để đối chiếu.",
  "canonical-audit": "Thống kê trên tập đã loại duplicate và bản ghi lỗi cấu trúc — sạch hơn raw nhưng vẫn là legacy.",
  "window-size": "Số nến đầu vào mà model nhìn lại để dự đoán.",
  quarantine:
    "Cách ly: pipeline chưa chứng minh được chất lượng nên kết quả của nó không được tạo tín hiệu mới.",
  ensemble: "Nhóm nhiều model gộp ý kiến; cũng phải qua gate như model đơn.",
  "append-only": "Chỉ ghi thêm, không sửa/xóa — bản ghi giữ nguyên trạng thái tại thời điểm quyết định.",
  "forward-journal":
    "Nhật ký quyết định ghi trước rồi chờ outcome thật; khác backtest vì không dùng dữ liệu tương lai.",
  "forward-evidence": "Bằng chứng từ quyết định được ghi trước rồi đo bằng dữ liệu sau đó — không phải backtest.",
  fill: "Giá khớp thật của lệnh mô phỏng; chỉ hiện khi thị trường thật khớp.",
  outcome: "Kết quả quan sát thật sau quyết định; chưa đủ nến sau thì chưa có outcome.",
  quote: "Giá thị trường thật tại thời điểm quyết định — chưa phải giá khớp.",
  "win-rate": "Tỷ lệ lệnh lãi trên tổng số lệnh đã đóng.",
  "net-return": "Lợi suất ròng tích lũy sau chi phí của chuỗi giao dịch mô phỏng.",
  pnl: "Profit & Loss — lãi hoặc lỗ của lệnh mô phỏng.",
  "equity-curve": "Đường giá trị vốn tích lũy theo thời gian của chuỗi lệnh mô phỏng.",
  "sl-tp": "Stop Loss / Take Profit — mức giá cắt lỗ và chốt lời khai báo trước.",
  sharpe: "Sharpe ratio — lợi suất trung bình chia cho độ biến động; cao hơn = hiệu quả hơn theo rủi ro.",
  drawdown: "Mức sụt giảm vốn lớn nhất từ đỉnh trong mô phỏng — rủi ro xấu nhất đã trải qua.",
};

/** Look up the plain-language definition of a jargon term (case-insensitive). */
export function getGlossaryDefinition(term: string): string | null {
  return TERMS[term.trim().toLowerCase()] ?? null;
}
