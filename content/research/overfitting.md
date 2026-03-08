
---

1. Sự khác biệt giữa Toán học thuần túy và Machine Learning (Đa thức nội suy Lagrange)

mở đầu bằng câu chuyện về Đa thức nội suy Lagrange.

- Trong Toán học lý thuyết: Nếu bạn có 10 điểm dữ liệu, toán học bảo rằng luôn luôn tìm được một đường cong (đa thức bậc 9) đi qua chính xác cả 10 điểm đó. Đây gọi là "nội suy" (interpolation).
    
- Trong Machine Learning (Thực tế): Tác giả khẳng định việc cố gắng đi qua chính xác 10 điểm đó là sai lầm.
    

- Lý do: Dữ liệu thực tế luôn có Nhiễu (Noise). Ví dụ: Bạn đo chiều cao của một người, có thể bạn nhìn lệch, thước đo bị mòn, hoặc người đó đứng không thẳng. Những sai số nhỏ đó cộng vào dữ liệu.
    
- Hậu quả: Nếu bắt máy tính "nội suy" chính xác từng điểm (như toán học), nó sẽ học cả cái sai (nhiễu) đó. Chúng ta cần "xấp xỉ" (approximation) – tức là tìm xu hướng chung chứ không cần chính xác tuyệt đối từng điểm.
    

### 2. Định nghĩa Overfitting qua "Độ phức tạp của mô hình" (Model Complexity)

dùng ví dụ về Đa thức bậc cao để giải thích độ phức tạp. Hãy tưởng tượng phương trình: $y = w_0 + w_1x + w_2x^2 + ... + w_dx^d$

- Bậc $d$ (Degree): Đại diện cho độ phức tạp.
    

- $d$ nhỏ (ví dụ $d=1$): Đường thẳng. Quá đơn giản -> Underfitting (Học dốt).
    
- $d$ vừa phải (ví dụ $d=3, 4$): Đường cong mềm mại. Phản ánh đúng bản chất dữ liệu -> Good fit.
    
- $d$ quá lớn (ví dụ $d=16$): Đường cong uốn lượn dữ dội. Để đi qua hết các điểm dữ liệu, đường cong phải dao động rất mạnh ở khoảng giữa các điểm.
    

- Hệ quả thị giác: Ở bậc 16, trong vùng có dữ liệu thì nó đi qua rất đúng, nhưng chỉ cần nhích ra khỏi vùng đó một chút (vùng không có dữ liệu training), đường cong lao vút lên trời hoặc cắm đầu xuống đất. Điều này nghĩa là mô hình dự đoán cực kỳ sai cho dữ liệu mới.
    

### 3. Đánh giá mô hình: Train Error vs. Test Error

Tác giả đưa ra hai thước đo để định lượng Overfitting:

1. Train Error (Sai số trên tập huấn luyện): Đo xem mô hình trả lời đúng bao nhiêu % trên những gì nó đã học.
    
2. Test Error (Sai số trên tập kiểm thử): Đo xem mô hình trả lời đúng bao nhiêu % trên những gì nó chưa từng thấy.
    

Quy luật quan trọng:

- Khi độ phức tạp tăng, Train Error luôn giảm (về gần 0).
    
- Tuy nhiên, Test Error sẽ có hình chữ U:
    

- Lúc đầu giảm (khi mô hình học tốt dần lên).
    
- Đến một điểm tối ưu (Good fit).
    
- Sau đó bật tăng trở lại (khi mô hình bắt đầu Overfitting - học vẹt).
    

=> Overfitting là khi: Train Error thấp nhưng Test Error cao.


---

4. Các giải pháp kỹ thuật (Phần quan trọng nhất)

Giới thiệu các phương pháp để ngăn chặn Overfitting

#### A. Validation Set (Tập dữ liệu kiểm định)

Vấn đề: Nếu bạn cứ nhìn vào Test Error để chỉnh sửa mô hình, thì vô tình bạn đã "luyện" mô hình theo tập Test luôn rồi. Lúc đó tập Test không còn khách quan nữa.

Giải pháp: Chia dữ liệu làm 3 phần (chứ không phải 2):

1. Training Set (60-70%): Dùng để máy tính học.
    
2. Validation Set (10-20%): Dùng để bạn (con người) tinh chỉnh mô hình, chọn xem bậc đa thức nào là tốt nhất.
    
3. Test Set (phần còn lại): Cất kỹ đi. Chỉ lôi ra dùng 1 lần duy nhất cuối cùng để báo cáo kết quả.
    

#### B. Regularization (Chính quy hóa) - Kỹ thuật "Thêm số hạng vào hàm mất mát"

Đây là phần trừu tượng nhất bài. Tác giả giải thích về Weight Decay (L2 Regularization).

Tư duy toán học:

Mục tiêu của máy tính là tìm bộ số $w$ (trọng số) để sai số là nhỏ nhất.

Hàm mục tiêu cũ: $J(w) = \text{Sai số dự đoán}$

Tác giả đề xuất hàm mục tiêu mới:

  
  

$$J(w) = \text{Sai số dự đoán} + \lambda \times (\text{Độ lớn của } w)$$

Trong đó:

- $\lambda$ (Lambda): Là một con số do bạn chọn (hệ số phạt).
    
- Độ lớn của $w$: Tổng bình phương các trọng số.
    

Giải thích trực quan:

- Khi Overfitting (đa thức uốn éo mạnh), các hệ số $w$ thường có giá trị cực kỳ lớn (ví dụ: $1000x^{16}$).
    
- Kỹ thuật này nói với máy tính: "Tao muốn mày tìm sai số nhỏ nhất, NHƯNG tao cũng phạt mày nếu mày dùng các số $w$ quá lớn".
    
- Để làm cho cái hàm $J(w)$ nhỏ nhất, máy tính buộc phải tìm cách cân bằng: vừa dự đoán đúng, vừa giữ cho $w$ nhỏ.
    
- Kết quả: $w$ nhỏ làm cho đường cong trở nên "phẳng" hơn, mượt hơn, bớt uốn éo -> Tránh được Overfitting.
    
- Cái tên Weight Decay (tiêu biến trọng số) nghĩa là kỹ thuật này làm cho các trọng số có xu hướng tiêu biến về gần 0.
    

#### C. Early Stopping (Dừng sớm)

Đây là kỹ thuật dựa trên quan sát quá trình học:

- Máy tính học qua từng vòng (epoch).
    
- Càng học lâu, nó càng khớp vào Training set (Train error giảm).
    
- Tuy nhiên, trên Validation set, lỗi sẽ giảm đến một lúc nào đó rồi bắt đầu tăng lại (dấu hiệu bắt đầu học vẹt).
    
- Hành động: Ngắt quá trình học ngay tại thời điểm lỗi trên Validation set bắt đầu tăng. Không cho học nữa.
    

### Tóm tắt lại "cặn kẽ":

1. Vấn đề: Máy tính rất dễ sa đà vào việc học chi tiết vụn vặt (nhiễu) của dữ liệu đã có mà quên mất quy luật tổng quát.
    
2. Dấu hiệu: Làm bài tập ở nhà (Train) thì 10 điểm, đi thi (Test) thì 2 điểm.
    
3. Cách chữa:
    

- Validation: Dùng một bài thi thử để chọn phương pháp học tốt nhất trước khi thi thật.
    
- Regularization: Ép máy tính phải dùng các phương trình đơn giản, mượt mà (hệ số $w$ nhỏ) thay vì các phương trình phức tạp, dao động mạnh.
    
- Early Stopping: Thấy máy bắt đầu học vẹt thì bắt dừng lại ngay.
    
