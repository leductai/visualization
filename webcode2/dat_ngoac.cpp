#include <iostream>
#include <vector>
#include <string>
using namespace std;

// Dung bieu thuc toi uu tu doan con, tra ve chuoi co ngoac day du.
string dung(int i, int j, const vector<double>& x, const vector<char>& op, const vector<vector<int>>& cat) {
    if (i == j) {
        string s = to_string(x[i]);
        s.erase(s.find_last_not_of('0') + 1, string::npos);
        if (!s.empty() && s.back() == '.') s.pop_back();
        return s;
    }
    int k = cat[i][j];
    return "(" + dung(i, k, x, op, cat) + " " + (op[k] == '+' ? "+" : "x") + " " + dung(k + 1, j, x, op, cat) + ")";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string s;
    if (!(cin >> s)) return 0;
    vector<double> x;
    vector<char> op;
    // Tach so va phep toan xen ke, chuan hoa x/*/x thanh x.
    for (size_t i = 0; i < s.size();) {
        if (isdigit(s[i]) || s[i] == '.') {
            size_t j = i;
            while (j < s.size() && (isdigit(s[j]) || s[j] == '.')) j++;
            x.push_back(stod(s.substr(i, j - i)));
            i = j;
        } else {
            op.push_back(s[i] == '+' ? '+' : 'x');
            i++;
        }
    }
    int n = (int)x.size() - 1;
    vector<vector<double>> dp(n + 1, vector<double>(n + 1, 0));
    vector<vector<int>> cat(n + 1, vector<int>(n + 1, -1));
    for (int i = 0; i <= n; i++) dp[i][i] = x[i];
    // Doan dai dan: thu moi diem cat k (chi dung voi so khong am).
    for (int len = 2; len <= n + 1; len++) {
        for (int i = 0; i + len - 1 <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = -1;
            for (int k = i; k < j; k++) {
                double trai = dp[i][k], phai = dp[k + 1][j];
                double ungVien = op[k] == '+' ? trai + phai : trai * phai;
                if (ungVien > dp[i][j]) { dp[i][j] = ungVien; cat[i][j] = k; }
            }
        }
    }
    cout << dp[0][n] << '\n';
    cout << dung(0, n, x, op, cat) << '\n';
    return 0;
}
