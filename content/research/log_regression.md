# logistics regression
- cải tiến linear regression, trả về một số tỷ lệ (0,1), tránh được trường hợp các outlier làm lệch kết quả.
- sử dụng hàm sigmoid:
	$f(s) = \frac{1}{1+e^{-s}}$
- hàm mất mát không dùng bình phương mà dùng log
- $j(w) = -\sum(y_{i}\log(\hat{y_{i}})+(1-y_{i})\cdot \log(1-\hat{y_{i}}))$
- y nhận giá trị 0 hoặc 1, ở mỗi i sẽ chạy một vế, 
- trừng phạt cực kỳ nặng
- tối ưu bằng gradient descent
- sử dụng khi cần biết xác suất xảy ra 
- TÙy chỉnh tham số:
- 
- **Kết quả:** Nó tạo ra một "ranh giới phân chia" (Decision Boundary) là một đường thẳng (hoặc mặt phẳng) để cắt không gian dữ liệu làm đôi: Bên này là Normal, bên kia là Attack.
# perceptron learning algorithm
- đầu vào (x): các "tín hiệu điện"
- trọng số (w): độ nhạy của dây thần kinh
- bộ tổng (z): cộng tất cả lại
- hàm kích hoạt(hàm sign): nếu $z>0$ , f(z) = 1, ngược lại thì f(z) = -1
- hàm mất mát: âm của các điểm sai (Vì các điểm sai luôn âm nên sẽ thành dương)
- thuật toán học $w_{mới} = w_{cũ} + x_{i}y_{i}$
	- vector $w_{cũ}$ đang xoay thành góc tù với điểm $x_{i}$
	- cộng lại giá trị, nếu y âm (sai), thì w tù hơn nữa, nếu y dương thì w nhọn hơn nữa, từ đó ta có w chính xác nhất
 - nếu các điểm phân bố lẫn lôn, vector w quay vòng vòng và không bao giờ chỉ đúng.
 - sử dụng trong deep learning và neural network, trong phần cứng và phân loại nhị phân
