#include <bits/stdc++.h>
using namespace std;
// Day con chung dai nhat (LCS) bang Quy hoach dong.
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string X, Y;
    if (!(cin >> X >> Y)) return 0;
    int n = X.size(), m = Y.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0)); // khoiTaoBang
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) {
        if (X[i - 1] == Y[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1; // khopNhau
        else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]); // layMax
    }
    string lcs;
    int i = n, j = m;
    while (i > 0 && j > 0) { // truyVet
        if (X[i - 1] == Y[j - 1]) { lcs.push_back(X[i - 1]); --i; --j; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) --i;
        else --j;
    }
    reverse(lcs.begin(), lcs.end());
    cout << dp[n][m] << '\n' << lcs; // inKetQua
    return 0;
}
