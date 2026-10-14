#include <iostream>
#include <vector>
#include <string>
using namespace std;
const long long VO_CUNG = (long long)4e18;

// Dung thu tu nhan toi uu tu doan con, tra ve chuoi co ngoac day du.
string dung(int i, int j, const vector<vector<int>>& cat) {
    if (i == j) return "A" + to_string(i + 1);
    int k = cat[i][j];
    return "(" + dung(i, k, cat) + " x " + dung(k + 1, j, cat) + ")";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int x;
    vector<int> p;
    while (cin >> x) p.push_back(x);
    int n = (int)p.size() - 1;
    if (n < 1) return 0;
    vector<vector<long long>> dp(n, vector<long long>(n, 0));
    vector<vector<int>> cat(n, vector<int>(n, -1));
    for (int i = 0; i < n; i++) dp[i][i] = 0;
    // Doan dai dan: thu moi diem cat k.
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = VO_CUNG;
            for (int k = i; k < j; k++) {
                long long ungVien = dp[i][k] + dp[k + 1][j] + (long long)p[i] * p[k + 1] * p[j + 1];
                if (ungVien < dp[i][j]) { dp[i][j] = ungVien; cat[i][j] = k; }
            }
        }
    }
    cout << dp[0][n - 1] << '\n';
    cout << dung(0, n - 1, cat) << '\n';
    return 0;
}
