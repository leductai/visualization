#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int x;
    vector<int> a;
    while (cin >> x) a.push_back(x);
    // LG: tap cac hoan vi cua day con; bat dau tu {(a0)}.
    vector<vector<int>> LG = { { a[0] } };
    // Chen tung phan tu vao moi vi tri cua tung hoan vi con.
    for (size_t i = 1; i < a.size(); i++) {
        vector<vector<int>> P;
        for (auto cur : LG) {
            for (size_t k = 0; k <= cur.size(); k++) {
                vector<int> y = cur;
                y.insert(y.begin() + k, a[i]);
                P.push_back(y);
            }
        }
        LG = P;
    }
    for (auto perm : LG) {
        for (size_t i = 0; i < perm.size(); i++) {
            if (i > 0) cout << ' ';
            cout << perm[i];
        }
        cout << '\n';
    }
    return 0;
}
