#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // dp[i]: day con dai nhat ket thuc tai i, hai so lien ke chenh nhau dung 1.
    vector<int> dp(n, 1), truoc(n, -1);
    int totNhat = 0, cuoi = -1;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (abs(a[i] - a[j]) == 1 && dp[j] + 1 > dp[i]) {
                dp[i] = dp[j] + 1;
                truoc[i] = j;
            }
        }
        if (dp[i] > totNhat) { totNhat = dp[i]; cuoi = i; }
    }
    cout << totNhat << '\n';
    // Truy vet tu cuoi ve dau roi in nguoc lai.
    vector<int> day;
    for (int v = cuoi; v != -1; v = truoc[v]) day.push_back(a[v]);
    for (int i = (int)day.size() - 1; i >= 0; i--) {
        if (i < (int)day.size() - 1) cout << ' ';
        cout << day[i];
    }
    if (!day.empty()) cout << '\n';
    return 0;
}
