# Bàn Học: học, ôn, làm

Biến `_diagrams/` và câu hỏi trong `On-tap/` của repo `interview-pre` thành PWA cài trên điện thoại. Repo này chỉ **đọc** interview-pre, không ghi gì vào đó.

## Cập nhật khi có sơ đồ mới

```bash
./sync.sh
```

Lệnh này build lại `web/`, commit nếu có thay đổi, rồi push. Vercel tự deploy sau mỗi lần push. Nếu interview-pre không nằm ở `~/Documents/interview-pre`, đặt `INTERVIEW_PRE=/đường/dẫn`.

Muốn chạy thử ở máy, không commit:

```bash
python3 build.py && cd web && python3 -m http.server 8765
```

## Cách hoạt động

- Sơ đồ: copy `_diagrams/` (bỏ `*.png`), rồi tự dựng lại `index.html` trên bản copy bằng `build-index.py` của interview-pre.
- Flashcard lấy từ ba nguồn:
  - Mọi vở Cornell trong `_diagrams/`: cột cue thành câu hỏi, còn Chốt / Bên dưới / Ví dụ / Bẫy thành đáp án. Không lấy Nôm na, Tự kiểm và khối FV.
  - `On-tap/01b_*.md`.
  - Các câu trong `On-tap/01-06` mà bạn đã tự viết đáp án.
- Vẽ thêm vở Cornell rồi chạy `./sync.sh` là có thẻ mới.
- Thẻ được tách thành mỗi chủ đề một file `web/cards/<thư-mục>.json`, kèm `cards/index.json`. Tiến độ "Chưa nhớ / Nhớ rồi" (3 hộp kiểu Leitner) lưu trong localStorage của từng máy, không đồng bộ giữa các máy.
- `web/` là output sinh ra nhưng **được commit**, vì Vercel không có interview-pre để build.
- Icon: nguồn là `assets/icon.svg`. Hai file `icon-192.png`/`icon-512.png` được xuất sẵn từ file đó, nên sửa SVG xong thì xuất lại PNG (ví dụ chụp bằng `google-chrome --headless --screenshot`).
- Service worker có `VERSION` là hash nội dung, tự đổi khi nội dung đổi, nên máy đã cài sẽ nhận bản mới.

## Deploy lần đầu

1. Tạo repo GitHub, có thể để private, rồi `git remote add origin …` và push.
2. Trên Vercel: Import repo đó. Framework chọn "Other", không cần build command, vì `vercel.json` đã trỏ `outputDirectory` vào `web`.

URL production là public: ai có link đều xem được mọi sơ đồ và thẻ. Trước mỗi lần sync, kiểm tra lại xem có nội dung nội bộ nào lọt vào `_diagrams/` không.
